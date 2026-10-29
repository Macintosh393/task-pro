import { createHash } from 'node:crypto';

import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';

import { RefreshTokensService } from './refresh-tokens.service.js';
import { RefreshToken } from './entities/refresh-token.entity.js';
import { EnvironmentVariables } from '../config/environment-variables.js';

// ---------------------------------------------------------------------------
// Mock node:crypto — keep createHash real, control randomBytes
// ---------------------------------------------------------------------------
const FAKE_RANDOM_HEX = 'a'.repeat(64); // 32 bytes → 64 hex chars

vi.mock('node:crypto', async (importOriginal) => {
  const actual = await importOriginal<typeof import('node:crypto')>();
  return {
    ...actual,
    randomBytes: vi.fn(() => Buffer.from('a'.repeat(64), 'hex')),
  };
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function realHash(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

// ---------------------------------------------------------------------------
// Factory helpers
// ---------------------------------------------------------------------------
function createMockRepository() {
  const qb = {
    delete: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    returning: vi.fn().mockReturnThis(),
    execute: vi.fn().mockResolvedValue({ raw: [] }),
  };

  const repo: Record<string, ReturnType<typeof vi.fn>> = {
    create: vi.fn((dto) => dto),
    save: vi.fn(async (entity) => entity),
    delete: vi.fn(async () => ({ affected: 1 })),
    createQueryBuilder: vi.fn(() => qb),
  };

  return { repo: repo as unknown as Repository<RefreshToken>, qb };
}

function createMockConfig(ttlDays = 7) {
  return {
    get: vi.fn().mockReturnValue(ttlDays),
  } as unknown as ConfigService<EnvironmentVariables, true>;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe('RefreshTokensService', () => {
  let service: RefreshTokensService;
  let repo: Repository<RefreshToken>;
  let qb: ReturnType<typeof createMockRepository>['qb'];
  let config: ConfigService<EnvironmentVariables, true>;

  const TTL_DAYS = 7;

  beforeEach(() => {
    vi.clearAllMocks();
    const mocks = createMockRepository();
    repo = mocks.repo;
    qb = mocks.qb;
    config = createMockConfig(TTL_DAYS);
    service = new RefreshTokensService(repo, config);
  });

  // -----------------------------------------------------------------------
  // issue()
  // -----------------------------------------------------------------------
  describe('issue()', () => {
    const userId = 'user-uuid-123';

    it('should return the raw (unhashed) hex token', async () => {
      const token = await service.issue(userId);

      expect(token).toBe(FAKE_RANDOM_HEX);
    });

    it('should call repository.create with tokenHash, userId, and expiresAt', async () => {
      await service.issue(userId);

      expect(repo.create).toHaveBeenCalledOnce();
      const createArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
        tokenHash: string;
        userId: string;
        expiresAt: Date;
      };

      expect(createArg.tokenHash).toBe(realHash(FAKE_RANDOM_HEX));
      expect(createArg.userId).toBe(userId);
      expect(createArg.expiresAt).toBeInstanceOf(Date);
    });

    it('should call repository.save with the entity returned by create', async () => {
      const fakeEntity = { id: 'entity-1' };
      (repo.create as ReturnType<typeof vi.fn>).mockReturnValueOnce(fakeEntity);

      await service.issue(userId);

      expect(repo.save).toHaveBeenCalledOnce();
      expect(repo.save).toHaveBeenCalledWith(fakeEntity);
    });

    it('should set expiresAt to approximately today + REFRESH_TOKEN_TTL_DAYS', async () => {
      await service.issue(userId);

      const createArg = (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as { expiresAt: Date };
      const expected = new Date();
      expected.setDate(expected.getDate() + TTL_DAYS);

      // Allow 5 seconds tolerance for test execution time
      const diffMs = Math.abs(createArg.expiresAt.getTime() - expected.getTime());
      expect(diffMs).toBeLessThan(5_000);
    });

    it('should read REFRESH_TOKEN_TTL_DAYS from ConfigService', async () => {
      await service.issue(userId);

      expect(config.get).toHaveBeenCalledWith('REFRESH_TOKEN_TTL_DAYS', {
        infer: true,
      });
    });
  });

  // -----------------------------------------------------------------------
  // rotate()
  // -----------------------------------------------------------------------
  describe('rotate()', () => {
    const oldToken = 'old-token-value';
    const userId = 'user-uuid-456';

    it('should delete the old token and return { userId, token } when token is valid and not expired', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);

      qb.execute.mockResolvedValueOnce({
        raw: [{ userId, expiresAt: futureDate }],
      });

      const result = await service.rotate(oldToken);

      expect(result.userId).toBe(userId);
      expect(result.token).toBe(FAKE_RANDOM_HEX);
    });

    it('should throw UnauthorizedException when token is not found (empty raw array)', async () => {
      qb.execute.mockResolvedValueOnce({ raw: [] });

      await expect(service.rotate(oldToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.rotate(oldToken)).rejects.toThrow('Refresh token is invalid');
    });

    it('should throw UnauthorizedException when token is found but expired', async () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 1);

      qb.execute.mockResolvedValueOnce({
        raw: [{ userId, expiresAt: pastDate }],
      });

      await expect(service.rotate(oldToken)).rejects.toThrow(UnauthorizedException);
      await expect(service.rotate(oldToken)).rejects.toThrow('Refresh token is invalid');
    });

    it('should build the query builder chain correctly', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      qb.execute.mockResolvedValueOnce({
        raw: [{ userId, expiresAt: futureDate }],
      });

      await service.rotate(oldToken);

      expect(repo.createQueryBuilder).toHaveBeenCalledOnce();
      expect(qb.delete).toHaveBeenCalledOnce();
      expect(qb.from).toHaveBeenCalledWith(RefreshToken);
      expect(qb.where).toHaveBeenCalledWith('tokenHash = :tokenHash', {
        tokenHash: realHash(oldToken),
      });
      expect(qb.returning).toHaveBeenCalledWith(['userId', 'expiresAt']);
      expect(qb.execute).toHaveBeenCalledOnce();
    });

    it('should issue a new token for the deleted userId', async () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      qb.execute.mockResolvedValueOnce({
        raw: [{ userId, expiresAt: futureDate }],
      });

      const issueSpy = vi.spyOn(service, 'issue');
      issueSpy.mockResolvedValueOnce('new-token');

      const result = await service.rotate(oldToken);

      expect(issueSpy).toHaveBeenCalledWith(userId);
      expect(result.token).toBe('new-token');

      issueSpy.mockRestore();
    });

    it('should throw UnauthorizedException when result.raw contains undefined first element', async () => {
      qb.execute.mockResolvedValueOnce({
        raw: [undefined],
      });

      await expect(service.rotate(oldToken)).rejects.toThrow(UnauthorizedException);
    });
  });

  // -----------------------------------------------------------------------
  // revoke()
  // -----------------------------------------------------------------------
  describe('revoke()', () => {
    const token = 'revoke-me-token';

    it('should call repository.delete with the hashed token', async () => {
      await service.revoke(token);

      expect(repo.delete).toHaveBeenCalledOnce();
      expect(repo.delete).toHaveBeenCalledWith({
        tokenHash: realHash(token),
      });
    });

    it('should not throw on successful revocation', async () => {
      await expect(service.revoke(token)).resolves.toBeUndefined();
    });
  });

  // -----------------------------------------------------------------------
  // hash() — tested indirectly
  // -----------------------------------------------------------------------
  describe('hash() (tested indirectly)', () => {
    it('should produce consistent hashes — same token always yields the same tokenHash in create calls', async () => {
      // Issue twice with the same mocked random token
      await service.issue('user-1');
      await service.issue('user-2');

      const firstHash = (
        (repo.create as ReturnType<typeof vi.fn>).mock.calls[0][0] as {
          tokenHash: string;
        }
      ).tokenHash;
      const secondHash = (
        (repo.create as ReturnType<typeof vi.fn>).mock.calls[1][0] as {
          tokenHash: string;
        }
      ).tokenHash;

      expect(firstHash).toBe(secondHash);
      expect(firstHash).toBe(realHash(FAKE_RANDOM_HEX));
    });

    it('should use the same hash logic across issue, rotate, and revoke', async () => {
      const knownToken = 'known-token-value';
      const expectedHash = realHash(knownToken);

      // revoke uses hash internally
      await service.revoke(knownToken);
      expect(repo.delete).toHaveBeenCalledWith({ tokenHash: expectedHash });

      // rotate uses hash internally
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      qb.execute.mockResolvedValueOnce({
        raw: [{ userId: 'u1', expiresAt: futureDate }],
      });

      await service.rotate(knownToken);
      expect(qb.where).toHaveBeenCalledWith('tokenHash = :tokenHash', {
        tokenHash: expectedHash,
      });
    });
  });
});
