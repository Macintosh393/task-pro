import { NotFoundException } from '@nestjs/common';

import { ColumnsController } from './columns.controller.js';
import type { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import type { BoardColumn } from './entities/column.entity.js';

describe('ColumnsController', () => {
  let controller: ColumnsController;
  let columnsService: { create: ReturnType<typeof vi.fn>; findAllByBoard: ReturnType<typeof vi.fn> };

  const userId = '11111111-1111-4111-8111-111111111111';
  const boardId = '22222222-2222-4222-8222-222222222222';
  const column = { id: '33333333-3333-4333-8333-333333333333', boardId, title: 'To Do', position: 0 } as BoardColumn;

  beforeEach(() => {
    columnsService = { create: vi.fn(), findAllByBoard: vi.fn() };
    controller = new ColumnsController(columnsService as unknown as ColumnsService);
  });

  it('create() passes the session user, the path board id and the dto to the service', async () => {
    const dto = Object.assign(new CreateColumnDto(), { title: 'To Do' });
    columnsService.create.mockResolvedValue(column);

    const result = await controller.create(userId, boardId, dto);

    expect(columnsService.create).toHaveBeenCalledWith(userId, boardId, dto);
    expect(result).toBe(column);
  });

  it('findAll() lists the columns of the path board for the session user', async () => {
    columnsService.findAllByBoard.mockResolvedValue([column]);

    const result = await controller.findAll(userId, boardId);

    expect(columnsService.findAllByBoard).toHaveBeenCalledWith(userId, boardId);
    expect(result).toEqual([column]);
  });

  it('propagates NotFoundException', async () => {
    columnsService.findAllByBoard.mockRejectedValue(new NotFoundException('Board not found'));

    await expect(controller.findAll(userId, boardId)).rejects.toThrow(NotFoundException);
  });
});
