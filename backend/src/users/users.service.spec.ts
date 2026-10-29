import { NotFoundException } from '@nestjs/common';
import { Repository } from 'typeorm';
import { UsersService } from './users.service.js';
import { User } from './entities/user.entity.js';

describe('UsersService', () => {
  let service: UsersService;
  let usersRepository: { findOne: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    id: 'user-id-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    avatar_url: null,
    theme: 'light',
    createdAt: new Date('2025-01-01'),
    updatedAt: new Date('2025-01-01'),
  } as User;

  beforeEach(() => {
    usersRepository = {
      findOne: vi.fn(),
    };

    service = new UsersService(usersRepository as unknown as Repository<User>);
  });

  describe('findByUsername()', () => {
    it('should return the user when found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByUsername('testuser');

      expect(result).toBe(mockUser);
    });

    it('should return null when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByUsername('nonexistent');

      expect(result).toBeNull();
    });

    it('should call repository.findOne with { where: { username } }', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await service.findByUsername('testuser');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { username: 'testuser' },
      });
    });
  });

  describe('findByEmail()', () => {
    it('should return the user when found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByEmail('test@example.com');

      expect(result).toBe(mockUser);
    });

    it('should return null when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      const result = await service.findByEmail('missing@example.com');

      expect(result).toBeNull();
    });

    it('should call repository.findOne with { where: { email } }', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await service.findByEmail('test@example.com');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { email: 'test@example.com' },
      });
    });
  });

  describe('findByIdOrFail()', () => {
    it('should return the user when found', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      const result = await service.findByIdOrFail('user-id-123');

      expect(result).toBe(mockUser);
    });

    it('should throw NotFoundException with message containing the id when user is not found', async () => {
      usersRepository.findOne.mockResolvedValue(null);

      await expect(service.findByIdOrFail('user-id-123')).rejects.toThrow(NotFoundException);
      await expect(service.findByIdOrFail('user-id-123')).rejects.toThrow(/user-id-123/i);
    });

    it('should call repository.findOne with { where: { id } }', async () => {
      usersRepository.findOne.mockResolvedValue(mockUser);

      await service.findByIdOrFail('user-id-123');

      expect(usersRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
      });
    });
  });
});
