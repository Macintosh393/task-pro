import { ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { compare } from 'bcryptjs';
import { QueryFailedError, Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import { RefreshTokensService } from './refresh-tokens.service.js';
import { UsersService } from '../users/users.service.js';
import { User } from '../users/entities/user.entity.js';

describe('registration', () => {
  const repository = { findOne: vi.fn(), create: vi.fn(), save: vi.fn() };
  const jwtService = { signAsync: vi.fn() };
  const refreshTokens = { issue: vi.fn() };
  const usersService = new UsersService(repository as unknown as Repository<User>);
  const service = new AuthService(
    usersService,
    jwtService as unknown as JwtService,
    refreshTokens as unknown as RefreshTokensService,
  );
  const dto = { name: 'Test User', email: 'test@example.com', password: 'TestPassword123!' };

  beforeEach(() => {
    vi.resetAllMocks();
    repository.findOne.mockResolvedValue(null);
    repository.create.mockImplementation((data) => Object.assign(new User(), data));
    repository.save.mockImplementation(async (user) => Object.assign(user, { id: 'user-123' }));
    jwtService.signAsync.mockResolvedValue('access-token');
    refreshTokens.issue.mockResolvedValue('refresh-token');
  });

  it('registers a user with a hashed password and issues the shared session', async () => {
    const result = await service.register(dto);

    expect(result.user).toMatchObject({ id: 'user-123', username: dto.name, email: dto.email });
    expect(await compare(dto.password, result.user.passwordHash)).toBe(true);
    expect(result.accessToken).toBe('access-token');
    expect(result.refreshToken).toBe('refresh-token');
    expect(jwtService.signAsync).toHaveBeenCalledWith({ sub: 'user-123' });
    expect(refreshTokens.issue).toHaveBeenCalledWith('user-123');
  });

  it('rejects an already registered email without creating a session', async () => {
    repository.findOne.mockResolvedValue({ id: 'user-123' });

    await expect(service.register(dto)).rejects.toThrow(ConflictException);

    expect(repository.save).not.toHaveBeenCalled();
    expect(refreshTokens.issue).not.toHaveBeenCalled();
  });

  it('normalizes registration email and name before saving', async () => {
    const result = await service.register({ ...dto, name: '  Test User  ', email: '  TEST@EXAMPLE.COM  ' });

    expect(repository.findOne).toHaveBeenCalledWith({ where: { email: 'test@example.com' } });
    expect(result.user.username).toBe('Test User');
    expect(result.user.email).toBe('test@example.com');
  });

  it('handles duplicate email errors from the database', async () => {
    const driverError = Object.assign(new Error('Duplicate email'), { code: '23505' });
    repository.save.mockRejectedValue(new QueryFailedError('INSERT INTO users', [], driverError));

    await expect(service.register(dto)).rejects.toThrow(ConflictException);

    expect(refreshTokens.issue).not.toHaveBeenCalled();
  });

  it('propagates other database failures', async () => {
    repository.save.mockRejectedValue(new Error('Database unavailable'));

    await expect(service.register(dto)).rejects.toThrow('Database unavailable');
  });
});
