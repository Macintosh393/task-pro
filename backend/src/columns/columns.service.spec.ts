import { NotFoundException } from '@nestjs/common';
import type { DataSource } from 'typeorm';

import type { BoardsService } from '../boards/boards.service.js';
import type { Board } from '../boards/entities/board.entity.js';
import { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { BoardColumn } from './entities/column.entity.js';

const NEXT_POSITION_SQL = 'SELECT COALESCE(MAX("existing"."position") + 1, 0) ...';

/** Records the calls of `manager.createQueryBuilder()` chains; `execute()` resolves to `{ raw: [row] }`. */
function createQueryBuilderSpy(row: Partial<BoardColumn>) {
  const builder = {
    select: vi.fn(() => builder),
    where: vi.fn(() => builder),
    getQuery: vi.fn(() => NEXT_POSITION_SQL),
    insert: vi.fn(() => builder),
    into: vi.fn(() => builder),
    values: vi.fn(() => builder),
    setParameter: vi.fn(() => builder),
    returning: vi.fn(() => builder),
    execute: vi.fn(() => Promise.resolve({ raw: [row] })),
  };

  return builder;
}

describe('ColumnsService', () => {
  let service: ColumnsService;
  let boardsService: { findOneOwnedOrFail: ReturnType<typeof vi.fn> };
  let builder: ReturnType<typeof createQueryBuilderSpy>;
  let transactionManager: { createQueryBuilder: ReturnType<typeof vi.fn>; create: ReturnType<typeof vi.fn> };
  let dataSource: { manager: { find: ReturnType<typeof vi.fn> }; transaction: ReturnType<typeof vi.fn> };

  const userId = '11111111-1111-4111-8111-111111111111';
  const boardId = '22222222-2222-4222-8222-222222222222';
  const columnId = '33333333-3333-4333-8333-333333333333';
  const row = { id: columnId, boardId, title: 'To Do', position: 0 };

  const dto = (title: string) => Object.assign(new CreateColumnDto(), { title });

  beforeEach(() => {
    boardsService = { findOneOwnedOrFail: vi.fn().mockResolvedValue({ id: boardId } as Board) };
    builder = createQueryBuilderSpy(row);
    transactionManager = {
      createQueryBuilder: vi.fn(() => builder),
      create: vi.fn((_entity: unknown, data: Partial<BoardColumn>) => Object.assign(new BoardColumn(), data)),
    };
    dataSource = {
      manager: { find: vi.fn().mockResolvedValue([]) },
      transaction: vi.fn((_isolation: string, run: (m: typeof transactionManager) => Promise<unknown>) =>
        run(transactionManager),
      ),
    };

    service = new ColumnsService(dataSource as unknown as DataSource, boardsService as unknown as BoardsService);
  });

  describe('create()', () => {
    it('does all its work inside one READ COMMITTED transaction', async () => {
      await service.create(userId, boardId, dto('To Do'));

      expect(dataSource.transaction).toHaveBeenCalledOnce();
      expect(dataSource.transaction).toHaveBeenCalledWith('READ COMMITTED', expect.any(Function));
      expect(builder.execute).toHaveBeenCalledOnce();
    });

    it('locks the board through the transaction, scoped to both board id and owner', async () => {
      await service.create(userId, boardId, dto('To Do'));

      expect(boardsService.findOneOwnedOrFail).toHaveBeenCalledWith(userId, boardId, {
        manager: transactionManager,
        lock: { mode: 'for_no_key_update' },
      });
    });

    it('inserts only after the board is locked', async () => {
      await service.create(userId, boardId, dto('To Do'));

      const lockedAt = boardsService.findOneOwnedOrFail.mock.invocationCallOrder[0];
      const insertedAt = builder.execute.mock.invocationCallOrder[0];
      expect(lockedAt).toBeLessThan(insertedAt);
    });

    it('computes the position inside the INSERT as max + 1 of the same board', async () => {
      await service.create(userId, boardId, dto('To Do'));

      expect(transactionManager.createQueryBuilder).toHaveBeenCalledWith(BoardColumn, 'existing');
      expect(builder.select).toHaveBeenCalledWith('COALESCE(MAX(existing.position) + 1, 0)');
      expect(builder.where).toHaveBeenCalledWith('existing.boardId = :boardId');
      expect(builder.into).toHaveBeenCalledWith(BoardColumn);
      expect(builder.setParameter).toHaveBeenCalledWith('boardId', boardId);
      expect(builder.returning).toHaveBeenCalledWith('*');

      const [values] = builder.values.mock.calls[0] as unknown as [{ position: () => string }];
      expect(values).toEqual({ boardId, title: 'To Do', position: expect.any(Function) });
      expect(values.position()).toBe(`(${NEXT_POSITION_SQL})`);
    });

    it('stores the board id as read from the database, not as written in the path', async () => {
      await service.create(userId, boardId.toUpperCase(), dto('To Do'));

      expect(builder.values).toHaveBeenCalledWith(expect.objectContaining({ boardId }));
      expect(builder.setParameter).toHaveBeenCalledWith('boardId', boardId);
    });

    it('takes the board from the argument, ignoring board-like fields on the dto', async () => {
      const tampered = Object.assign(dto('To Do'), { boardId: 'other-board', position: 99 });

      await service.create(userId, boardId, tampered);

      expect(builder.values).toHaveBeenCalledWith({ boardId, title: 'To Do', position: expect.any(Function) });
    });

    it('returns the inserted row as a BoardColumn entity', async () => {
      const result = await service.create(userId, boardId, dto('To Do'));

      expect(transactionManager.create).toHaveBeenCalledWith(BoardColumn, row);
      expect(result).toBeInstanceOf(BoardColumn);
      expect(result).toEqual(Object.assign(new BoardColumn(), row));
    });

    it('propagates 404 and stores nothing when the board is missing or foreign', async () => {
      boardsService.findOneOwnedOrFail.mockRejectedValue(new NotFoundException('Board not found'));

      await expect(service.create(userId, boardId, dto('To Do'))).rejects.toThrow(NotFoundException);
      expect(builder.execute).not.toHaveBeenCalled();
    });

    it('propagates database errors from the insert', async () => {
      const failure = new Error('connection lost');
      builder.execute.mockRejectedValue(failure);

      await expect(service.create(userId, boardId, dto('To Do'))).rejects.toBe(failure);
    });
  });

  describe('findAllByBoard()', () => {
    it('reads the columns with ownership in the same query, ordered by position', async () => {
      await service.findAllByBoard(userId, boardId);

      expect(dataSource.transaction).not.toHaveBeenCalled();
      expect(dataSource.manager.find).toHaveBeenCalledWith(BoardColumn, {
        where: { board: { id: boardId, userId } },
        order: { position: 'ASC' },
      });
    });

    it('returns the columns of a non-empty board without a second query', async () => {
      const columns = [{ id: 'a' }, { id: 'b' }] as BoardColumn[];
      dataSource.manager.find.mockResolvedValue(columns);

      await expect(service.findAllByBoard(userId, boardId)).resolves.toBe(columns);
      expect(boardsService.findOneOwnedOrFail).not.toHaveBeenCalled();
    });

    it('returns an empty array for an own board without columns', async () => {
      await expect(service.findAllByBoard(userId, boardId)).resolves.toEqual([]);
      expect(boardsService.findOneOwnedOrFail).toHaveBeenCalledWith(userId, boardId);
    });

    it('checks the board only after the read, so a board deleted in between is a 404', async () => {
      await service.findAllByBoard(userId, boardId);

      const readAt = dataSource.manager.find.mock.invocationCallOrder[0];
      const checkedAt = boardsService.findOneOwnedOrFail.mock.invocationCallOrder[0];
      expect(readAt).toBeLessThan(checkedAt);
    });

    it('throws 404 when nothing was found and the board is missing or foreign', async () => {
      boardsService.findOneOwnedOrFail.mockRejectedValue(new NotFoundException('Board not found'));

      await expect(service.findAllByBoard(userId, boardId)).rejects.toThrow(NotFoundException);
    });
  });
});
