import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { BoardsService } from '../boards/boards.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { BoardColumn } from './entities/column.entity.js';

@Injectable()
export class ColumnsService {
  constructor(
    private readonly dataSource: DataSource,
    private readonly boardsService: BoardsService,
  ) {}

  async create(userId: string, boardId: string, dto: CreateColumnDto): Promise<BoardColumn> {
    // READ COMMITTED is load-bearing: each statement takes a fresh snapshot, so the INSERT
    // below sees the columns committed by whoever held the board lock before us. Under
    // REPEATABLE READ it would read the snapshot taken before the lock was granted.
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      // The row lock serializes column creation per board, so two concurrent requests
      // cannot both read the same max position. FOR NO KEY UPDATE does not block the
      // FK checks (KEY SHARE) of inserts into other tables that reference the board.
      const board = await this.boardsService.findOneOwnedOrFail(userId, boardId, {
        manager,
        lock: { mode: 'for_no_key_update' },
      });

      const nextPosition = manager
        .createQueryBuilder(BoardColumn, 'existing')
        .select('COALESCE(MAX(existing.position) + 1, 0)')
        .where('existing.boardId = :boardId');

      // The position is computed inside the INSERT, saving a round trip while the board is locked.
      // `board.id` comes from the database, so the response carries the canonical lower-case uuid
      // even when the path used upper case.
      const { raw } = await manager
        .createQueryBuilder()
        .insert()
        .into(BoardColumn)
        .values({ boardId: board.id, title: dto.title, position: () => `(${nextPosition.getQuery()})` })
        .setParameter('boardId', board.id)
        .returning('*')
        .execute();

      return manager.create(BoardColumn, (raw as Partial<BoardColumn>[])[0]);
    });
  }

  async findAllByBoard(userId: string, boardId: string): Promise<BoardColumn[]> {
    // Ownership is part of the query, so a non-empty board costs a single round trip.
    const columns = await this.dataSource.manager.find(BoardColumn, {
      where: { board: { id: boardId, userId } },
      order: { position: 'ASC' },
    });

    if (columns.length === 0) {
      // Tells an empty board apart from a missing or foreign one. Checked after the read,
      // so a board deleted in between answers 404 rather than [].
      await this.boardsService.findOneOwnedOrFail(userId, boardId);
    }

    return columns;
  }
}
