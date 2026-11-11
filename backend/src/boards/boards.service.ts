import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { QueryFailedError, Repository } from 'typeorm';

import { DEFAULT_BOARD_BACKGROUND, DEFAULT_BOARD_ICON } from './board-options.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { Board } from './entities/board.entity.js';

const FOREIGN_KEY_VIOLATION = '23503';

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

  async findOneOwnedOrFail(userId: string, id: string): Promise<Board> {
    // Ownership is part of the query, so another user's board is indistinguishable from a missing one.
    const board = await this.boardsRepository.findOne({ where: { id, userId } });

    if (board === null) {
      throw new NotFoundException('Board not found');
    }

    return board;
  }
}
