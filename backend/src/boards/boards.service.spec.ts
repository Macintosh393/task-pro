import { NotFoundException, UnauthorizedException } from '@nestjs/common';
import { QueryFailedError, Repository } from 'typeorm';

import { BoardsService } from './boards.service.js';
import { Board } from './entities/board.entity.js';
import { CreateBoardDto } from './dto/create-board.dto.js';

describe('BoardsService', () => {
  let service: BoardsService;
  let repository: {
    create: ReturnType<typeof vi.fn>;
    save: ReturnType<typeof vi.fn>;
    find: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const boardId = '22222222-2222-4222-8222-222222222222';

  const dto = (data: Partial<CreateBoardDto>): CreateBoardDto => Object.assign(new CreateBoardDto(), data);

  beforeEach(() => {
    repository = {
      create: vi.fn((data: Partial<Board>) => ({ ...data }) as Board),
      save: vi.fn((board: Board) => Promise.resolve({ ...board, id: boardId })),
      find: vi.fn(),
      findOne: vi.fn(),
    };

    service = new BoardsService(repository as unknown as Repository<Board>);
  });

  describe('create()', () => {
    it('stores the board for the user passed in, with the provided values', async () => {
      const result = await service.create(userId, dto({ title: 'Roadmap', icon: 'star', background: 'bg-07' }));

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        title: 'Roadmap',
        icon: 'star',
        background: 'bg-07',
      });
      expect(repository.save).toHaveBeenCalledOnce();
      expect(result).toMatchObject({ id: boardId, userId, title: 'Roadmap', icon: 'star', background: 'bg-07' });
    });

    it('defaults to the first icon and no background when omitted', async () => {
      await service.create(userId, dto({ title: 'Roadmap' }));

      expect(repository.create).toHaveBeenCalledWith({
        userId,
        title: 'Roadmap',
        icon: 'project',
        background: 'none',
      });
    });

    it('defaults only the omitted field', async () => {
      await service.create(userId, dto({ title: 'Roadmap', icon: 'hexagon' }));

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ icon: 'hexagon', background: 'none' }));

      repository.create.mockClear();
      await service.create(userId, dto({ title: 'Roadmap', background: 'bg-15' }));

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ icon: 'project', background: 'bg-15' }));
    });

    it('always uses the session user as owner, even if the dto carries an owner-like field', async () => {
      const tampered = Object.assign(dto({ title: 'Roadmap' }), { userId: 'someone-else' });

      await service.create(userId, tampered);

      expect(repository.create).toHaveBeenCalledWith(expect.objectContaining({ userId }));
    });

    it('turns a foreign key violation (user no longer exists) into 401', async () => {
      const driverError = Object.assign(new Error('violates foreign key constraint'), { code: '23503' });
      repository.save.mockRejectedValue(new QueryFailedError('INSERT', [], driverError));

      await expect(service.create(userId, dto({ title: 'Roadmap' }))).rejects.toThrow(UnauthorizedException);
    });

    it('rethrows other database errors unchanged', async () => {
      const driverError = Object.assign(new Error('connection lost'), { code: '08006' });
      const failure = new QueryFailedError('INSERT', [], driverError);
      repository.save.mockRejectedValue(failure);

      await expect(service.create(userId, dto({ title: 'Roadmap' }))).rejects.toBe(failure);
    });

    it('rethrows non-database errors unchanged', async () => {
      const failure = new Error('boom');
      repository.save.mockRejectedValue(failure);

      await expect(service.create(userId, dto({ title: 'Roadmap' }))).rejects.toBe(failure);
    });
  });

  describe('findAllByUser()', () => {
    it('queries only the given user, oldest first with id as a tiebreaker', async () => {
      repository.find.mockResolvedValue([]);

      await service.findAllByUser(userId);

      expect(repository.find).toHaveBeenCalledWith({
        where: { userId },
        order: { createdAt: 'ASC', id: 'ASC' },
      });
    });

    it('returns an empty array when the user has no boards', async () => {
      repository.find.mockResolvedValue([]);

      await expect(service.findAllByUser(userId)).resolves.toEqual([]);
    });

    it('returns the repository result in the given order', async () => {
      const boards = [{ id: 'a' }, { id: 'b' }] as Board[];
      repository.find.mockResolvedValue(boards);

      await expect(service.findAllByUser(userId)).resolves.toBe(boards);
    });
  });

  describe('findOneOwnedOrFail()', () => {
    it('scopes the lookup by both board id and owner in a single query', async () => {
      repository.findOne.mockResolvedValue({ id: boardId, userId } as Board);

      await service.findOneOwnedOrFail(userId, boardId);

      expect(repository.findOne).toHaveBeenCalledOnce();
      expect(repository.findOne).toHaveBeenCalledWith({ where: { id: boardId, userId } });
    });

    it('returns the board when it belongs to the user', async () => {
      const board = { id: boardId, userId } as Board;
      repository.findOne.mockResolvedValue(board);

      await expect(service.findOneOwnedOrFail(userId, boardId)).resolves.toBe(board);
    });

    it('throws NotFoundException when nothing matches (unknown or someone else’s board)', async () => {
      repository.findOne.mockResolvedValue(null);

      await expect(service.findOneOwnedOrFail(userId, boardId)).rejects.toThrow(NotFoundException);
    });

    it('does not reveal the requested id or owner in the error message', async () => {
      repository.findOne.mockResolvedValue(null);

      const error: unknown = await service.findOneOwnedOrFail(userId, boardId).then(
        () => null,
        (e: unknown) => e,
      );

      expect(error).toBeInstanceOf(NotFoundException);
      const message = (error as NotFoundException).message;
      expect(message).toBe('Board not found');
      expect(message).not.toContain(boardId);
      expect(message).not.toContain(userId);
    });
  });
});
