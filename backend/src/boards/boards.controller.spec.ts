import { NotFoundException } from '@nestjs/common';

import { BoardsController } from './boards.controller.js';
import type { BoardsService } from './boards.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import type { Board } from './entities/board.entity.js';

describe('BoardsController', () => {
  let controller: BoardsController;
  let boardsService: {
    create: ReturnType<typeof vi.fn>;
    findAllByUser: ReturnType<typeof vi.fn>;
    findOneOwnedOrFail: ReturnType<typeof vi.fn>;
  };

  const userId = '11111111-1111-4111-8111-111111111111';
  const boardId = '22222222-2222-4222-8222-222222222222';
  const board = { id: boardId, userId, title: 'Roadmap', icon: 'project', background: 'none' } as Board;

  beforeEach(() => {
    boardsService = {
      create: vi.fn(),
      findAllByUser: vi.fn(),
      findOneOwnedOrFail: vi.fn(),
    };

    controller = new BoardsController(boardsService as unknown as BoardsService);
  });

  it('create() passes the session user id and the dto to the service', async () => {
    const dto = Object.assign(new CreateBoardDto(), { title: 'Roadmap' });
    boardsService.create.mockResolvedValue(board);

    const result = await controller.create(userId, dto);

    expect(boardsService.create).toHaveBeenCalledWith(userId, dto);
    expect(result).toBe(board);
  });

  it('findAll() lists boards of the session user only', async () => {
    boardsService.findAllByUser.mockResolvedValue([board]);

    const result = await controller.findAll(userId);

    expect(boardsService.findAllByUser).toHaveBeenCalledWith(userId);
    expect(result).toEqual([board]);
  });

  it('findOne() looks the board up by session user and path id', async () => {
    boardsService.findOneOwnedOrFail.mockResolvedValue(board);

    const result = await controller.findOne(userId, boardId);

    expect(boardsService.findOneOwnedOrFail).toHaveBeenCalledWith(userId, boardId);
    expect(result).toBe(board);
  });

  it('findOne() propagates NotFoundException', async () => {
    boardsService.findOneOwnedOrFail.mockRejectedValue(new NotFoundException('Board not found'));

    await expect(controller.findOne(userId, boardId)).rejects.toThrow(NotFoundException);
  });
});
