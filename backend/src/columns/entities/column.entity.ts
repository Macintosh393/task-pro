import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';

import { Board } from '../../boards/entities/board.entity.js';

/**
 * A column of a board. Named BoardColumn so that it does not shadow TypeORM's `@Column`.
 *
 * `position` is 0-based and unique within a board; new columns get max + 1. The unique
 * constraint is deferrable so that a future reorder can swap positions inside one
 * transaction (`SET CONSTRAINTS ... DEFERRED`), and it doubles as the index for
 * "columns of a board in order". Constraint names are pinned to the AddColumns migration.
 */
@Entity('columns')
@Unique('UQ_columns_board_position', ['boardId', 'position'], { deferrable: 'INITIALLY IMMEDIATE' })
export class BoardColumn {
  @ApiProperty({ example: '7c9e6679-7425-40de-944b-e07fc1f90ae7' })
  @PrimaryGeneratedColumn('uuid', { primaryKeyConstraintName: 'PK_columns_id' })
  id: string;

  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @Column({ type: 'uuid' })
  boardId: string;

  @Exclude()
  @ManyToOne(() => Board, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'boardId', foreignKeyConstraintName: 'FK_columns_boardId_boards' })
  board: Board;

  @ApiProperty({ example: 'To Do', maxLength: 255 })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ example: 0, description: '0-based place of the column on its board' })
  @Column({ type: 'integer' })
  position: number;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
