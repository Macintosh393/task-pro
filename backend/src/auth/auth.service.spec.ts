import { ConflictException } from '@nestjs/common';
import { compare } from 'bcryptjs';
import { QueryFailedError } from 'typeorm';
import type { Repository } from 'typeorm';
import { AuthService } from './auth.service.js';
import type { User } from '../users/user.entity.js';

describe('AuthService', () => {
  const usersRepository = {
    findOneBy: vi.fn(),
    create: vi.fn(),
    save: vi.fn(),
  };

  const authService = new AuthService(usersRepository as unknown as Repository<User>);

  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('registers a new user', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.create.mockImplementation((user) => user);
    usersRepository.save.mockImplementation(async (user) => ({
      ...user,
      id: 'user-123',
    }));

    const result = await authService.register({
      name: 'Test User',
      email: 'test@example.com',
      password: 'TestPassword123!',
    });

    expect(result).toEqual({
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    });

    const savedUser = usersRepository.save.mock.calls[0][0];

    expect(await compare('TestPassword123!', savedUser.passwordHash)).toBe(true);
    expect(result).not.toHaveProperty('passwordHash');
  });

  it('rejects an already registered email', async () => {
    usersRepository.findOneBy.mockResolvedValue({
      id: 'user-123',
      email: 'test@example.com',
    });

    await expect(
      authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
      }),
    ).rejects.toThrow(ConflictException);

    expect(usersRepository.save).not.toHaveBeenCalled();
  });

  it('normalizes email and name before saving', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.create.mockImplementation((user) => user);
    usersRepository.save.mockImplementation(async (user) => ({
      ...user,
      id: 'user-123',
    }));

    const result = await authService.register({
      name: '  Test User  ',
      email: '  TEST@EXAMPLE.COM  ',
      password: 'TestPassword123!',
    });

    expect(usersRepository.findOneBy).toHaveBeenCalledWith({
      email: 'test@example.com',
    });

    expect(result.name).toBe('Test User');
    expect(result.email).toBe('test@example.com');
  });

  it('handles duplicate email errors from the database', async () => {
    usersRepository.findOneBy.mockResolvedValue(null);
    usersRepository.create.mockImplementation((user) => user);

    const driverError = new Error('Duplicate email') as Error & { code: string };
    driverError.code = '23505';

    const databaseError = new QueryFailedError('INSERT INTO users', [], driverError);

    usersRepository.save.mockRejectedValue(databaseError);

    await expect(
      authService.register({
        name: 'Test User',
        email: 'test@example.com',
        password: 'TestPassword123!',
      }),
    ).rejects.toThrow(ConflictException);
  });
});
