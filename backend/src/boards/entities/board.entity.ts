import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from '../../users/entities/user.entity.js';
import {
  BOARD_BACKGROUNDS,
  BOARD_ICONS,
  DEFAULT_BOARD_BACKGROUND,
  DEFAULT_BOARD_ICON,
  type BoardBackground,
  type BoardIcon,
} from '../board-options.js';

@Entity('boards')
@Index(['userId', 'createdAt', 'id'])
export class Board {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Exclude()
  @Column({ type: 'uuid' })
  userId: string;

  @Exclude()
  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @ApiProperty({ example: 'Project Alpha', maxLength: 255 })
  @Column({ type: 'varchar', length: 255 })
  title: string;

  @ApiProperty({ enum: BOARD_ICONS, example: DEFAULT_BOARD_ICON })
  @Column({ name: 'iconId', type: 'varchar', length: 50, default: DEFAULT_BOARD_ICON })
  icon: BoardIcon;

  @ApiProperty({ enum: BOARD_BACKGROUNDS, example: DEFAULT_BOARD_BACKGROUND })
  @Column({ name: 'backgroundId', type: 'varchar', length: 50, default: DEFAULT_BOARD_BACKGROUND })
  background: BoardBackground;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
