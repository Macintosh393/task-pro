import { ApiProperty } from '@nestjs/swagger';
import { Exclude } from 'class-transformer';
import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';

@Entity('users')
export class User {
  @ApiProperty({ example: '3fa85f64-5717-4562-b3fc-2c963f66afa6' })
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ApiProperty({ example: 'user' })
  @Column({ type: 'varchar', length: 32 })
  username: string;

  @ApiProperty({ example: 'user@example.com' })
  @Column({ type: 'varchar', length: 255, unique: true })
  email: string;

  @Exclude()
  @Column({ type: 'varchar', length: 255 })
  passwordHash: string;

  @ApiProperty({ example: 'https://example.com/avatar.png' })
  @Column({ name: 'avatarUrl', type: 'varchar', length: 255, nullable: true })
  avatarUrl: string | null;

  @ApiProperty({ example: 'dark' })
  @Column({ type: 'varchar', length: 10, default: 'dark' })
  theme: string;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @CreateDateColumn()
  createdAt: Date;

  @ApiProperty({ example: '2026-07-16T10:30:00.000Z' })
  @UpdateDateColumn()
  updatedAt: Date;
}
