import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityManager, FindOneOptions, QueryFailedError, Repository } from 'typeorm';

import { DEFAULT_BOARD_BACKGROUND, DEFAULT_BOARD_ICON } from './board-options.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { Board } from './entities/board.entity.js';

const FOREIGN_KEY_VIOLATION = '23503';

export interface FindOwnedBoardOptions {
  /** Runs the lookup through this manager, e.g. the one of an open transaction. */
  manager?: EntityManager;
  /** Row lock to take on the board; requires `manager` to belong to an open transaction. */
  lock?: FindOneOptions<Board>['lock'];
}

@Injectable()
export class BoardsService {
  constructor(
    @InjectRepository(Board)
    private readonly boardsRepository: Repository<Board>,
  ) {}

  async create(userId: string, dto: CreateBoardDto): Promise<Board> {
    const board = this.boardsRepository.create({
      userId,
      title: dto.title,
      icon: dto.icon ?? DEFAULT_BOARD_ICON,
      background: dto.background ?? DEFAULT_BOARD_BACKGROUND,
    });

    try {
      return await this.boardsRepository.save(board);
    } catch (error) {
      // A still-valid token can outlive its user; the FK then rejects the insert.
      if (
        error instanceof QueryFailedError &&
        (error.driverError as { code?: string }).code === FOREIGN_KEY_VIOLATION
      ) {
        throw new UnauthorizedException('Authentication is required');
      }
      throw error;
    }
  }

  async findAllByUser(userId: string): Promise<Board[]> {
    return this.boardsRepository.find({
      where: { userId },
      order: { createdAt: 'ASC', id: 'ASC' },
    });
  }

  async findOneOwnedOrFail(userId: string, id: string, { manager, lock }: FindOwnedBoardOptions = {}): Promise<Board> {
    const repository = manager ? manager.getRepository(Board) : this.boardsRepository;

    // Ownership is part of the query, so another user's board is indistinguishable from a missing one.
    const board = await repository.findOne({ where: { id, userId }, lock });

    if (board === null) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
}
