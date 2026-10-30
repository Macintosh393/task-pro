import { Test, TestingModule } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

import { AuthService } from './auth.service.js';
import { UsersService } from '../users/users.service.js';
import { JwtService } from '@nestjs/jwt';
import { RefreshTokensService } from './refresh-tokens.service.js';
import { User } from '../users/entities/user.entity.js';

vi.mock('bcryptjs', () => {
  const compare = vi.fn();
  return {
    default: { compare },
    compare,
  };
});

const mockUser: User = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  username: 'testuser',
  email: 'user@example.com',
  passwordHash: '$2a$10$hashedpasswordvalue',
  avatar_url: null,
  theme: 'dark',
  createdAt: new Date('2026-07-16T10:30:00.000Z'),
  updatedAt: new Date('2026-07-16T10:30:00.000Z'),
};

describe('AuthService', () => {
  let authService: AuthService;
  let usersService: { findByEmail: ReturnType<typeof vi.fn> };
  let jwtService: { signAsync: ReturnType<typeof vi.fn> };
  let refreshTokensService: {
    issue: ReturnType<typeof vi.fn>;
    rotate: ReturnType<typeof vi.fn>;
    revoke: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    usersService = { findByEmail: vi.fn() };
    jwtService = { signAsync: vi.fn() };
    refreshTokensService = {
      issue: vi.fn(),
      rotate: vi.fn(),
      revoke: vi.fn(),
    };
    (bcrypt.compare as ReturnType<typeof vi.fn>).mockReset();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UsersService, useValue: usersService },
        { provide: JwtService, useValue: jwtService },
        { provide: RefreshTokensService, useValue: refreshTokensService },
      ],
    }).compile();

    authService = module.get<AuthService>(AuthService);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('login()', () => {
    const loginDto = { email: 'user@example.com', password: 'secret-password' };

    it('should return accessToken, refreshToken, and user on successful login', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('access-token-value');
      refreshTokensService.issue.mockResolvedValue('refresh-token-value');

      const result = await authService.login(loginDto);

      expect(result).toEqual({
        accessToken: 'access-token-value',
        refreshToken: 'refresh-token-value',
        user: mockUser,
      });
    });

    it('should throw UnauthorizedException when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow('Wrong email or password');
    });

    it('should throw UnauthorizedException when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow('Wrong email or password');
    });

    it('should pass the correct email to findByEmail', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('at');
      refreshTokensService.issue.mockResolvedValue('rt');

      await authService.login(loginDto);

      expect(usersService.findByEmail).toHaveBeenCalledWith('user@example.com');
    });

    it('should call bcrypt.compare with the raw password and stored hash', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('at');
      refreshTokensService.issue.mockResolvedValue('rt');

      await authService.login(loginDto);

      expect(bcrypt.compare).toHaveBeenCalledWith('secret-password', mockUser.passwordHash);
    });

    it('should call jwtService.signAsync with { sub: user.id }', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('at');
      refreshTokensService.issue.mockResolvedValue('rt');

      await authService.login(loginDto);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: mockUser.id });
    });

    it('should call refreshTokensService.issue with user.id', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(true);
      jwtService.signAsync.mockResolvedValue('at');
      refreshTokensService.issue.mockResolvedValue('rt');

      await authService.login(loginDto);

      expect(refreshTokensService.issue).toHaveBeenCalledWith(mockUser.id);
    });

    it('should not call bcrypt.compare when user is not found', async () => {
      usersService.findByEmail.mockResolvedValue(null);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(bcrypt.compare).not.toHaveBeenCalled();
    });

    it('should not call jwtService.signAsync when password does not match', async () => {
      usersService.findByEmail.mockResolvedValue(mockUser);
      (bcrypt.compare as ReturnType<typeof vi.fn>).mockResolvedValue(false);

      await expect(authService.login(loginDto)).rejects.toThrow(UnauthorizedException);

      expect(jwtService.signAsync).not.toHaveBeenCalled();
      expect(refreshTokensService.issue).not.toHaveBeenCalled();
    });
  });

  describe('refresh()', () => {
    const oldToken = 'old-refresh-token';

    it('should return a new token pair on successful rotation', async () => {
      refreshTokensService.rotate.mockResolvedValue({
        userId: mockUser.id,
        token: 'new-refresh-token',
      });
      jwtService.signAsync.mockResolvedValue('new-access-token');

      const result = await authService.refresh(oldToken);

      expect(result).toEqual({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });

    it('should propagate UnauthorizedException when rotate() throws', async () => {
      refreshTokensService.rotate.mockRejectedValue(new UnauthorizedException('Refresh token is invalid'));

      await expect(authService.refresh(oldToken)).rejects.toThrow(UnauthorizedException);
      await expect(authService.refresh(oldToken)).rejects.toThrow('Refresh token is invalid');
    });

    it('should call jwtService.signAsync with { sub: userId } from rotate result', async () => {
      const rotatedUserId = 'rotated-user-id';
      refreshTokensService.rotate.mockResolvedValue({
        userId: rotatedUserId,
        token: 'new-rt',
      });
      jwtService.signAsync.mockResolvedValue('new-at');

      await authService.refresh(oldToken);

      expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: rotatedUserId });
    });

    it('should pass the provided token to rotate()', async () => {
      refreshTokensService.rotate.mockResolvedValue({
        userId: mockUser.id,
        token: 'new-rt',
      });
      jwtService.signAsync.mockResolvedValue('new-at');

      await authService.refresh(oldToken);

      expect(refreshTokensService.rotate).toHaveBeenCalledWith(oldToken);
    });
  });

  describe('logout()', () => {
    const token = 'refresh-token-to-revoke';

    it('should call revoke with the provided token', async () => {
      refreshTokensService.revoke.mockResolvedValue(undefined);

      await authService.logout(token);

      expect(refreshTokensService.revoke).toHaveBeenCalledWith(token);
    });

    it('should not throw when revoke succeeds', async () => {
      refreshTokensService.revoke.mockResolvedValue(undefined);

      await expect(authService.logout(token)).resolves.toBeUndefined();
    });

    it('should propagate errors if revoke throws', async () => {
      const error = new Error('DB failure');
      refreshTokensService.revoke.mockRejectedValue(error);

      await expect(authService.logout(token)).rejects.toThrow('DB failure');
    });
  });
});
