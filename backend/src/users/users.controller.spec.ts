import { NotFoundException } from '@nestjs/common';

import { UsersController } from './users.controller.js';
import type { UsersService } from './users.service.js';
import type { User } from './entities/user.entity.js';

describe('UsersController', () => {
  let controller: UsersController;
  let usersService: { findByIdOrFail: ReturnType<typeof vi.fn> };

  const mockUser: User = {
    id: 'user-123',
    username: 'testuser',
    email: 'test@example.com',
    passwordHash: 'hashed-password',
    avatarUrl: null,
    theme: 'dark',
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-02'),
  };

  beforeEach(() => {
    usersService = {
      findByIdOrFail: vi.fn(),
    };

    controller = new UsersController(usersService as unknown as UsersService);
  });

  describe('me()', () => {
    it('should return the user from usersService.findByIdOrFail', async () => {
      usersService.findByIdOrFail.mockResolvedValue(mockUser);

      const result = await controller.me('user-123');

      expect(result).toBe(mockUser);
    });

    it('should pass the userId argument to findByIdOrFail', async () => {
      usersService.findByIdOrFail.mockResolvedValue(mockUser);

      await controller.me('user-456');

      expect(usersService.findByIdOrFail).toHaveBeenCalledOnce();
      expect(usersService.findByIdOrFail).toHaveBeenCalledWith('user-456');
    });

    it('should propagate NotFoundException when findByIdOrFail throws', async () => {
      usersService.findByIdOrFail.mockRejectedValue(new NotFoundException('User not found'));

      await expect(controller.me('nonexistent-id')).rejects.toThrow(NotFoundException);
    });
  });
});
