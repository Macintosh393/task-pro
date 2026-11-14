import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { BoardsModule } from '../boards/boards.module.js';
import { ColumnsController } from './columns.controller.js';
import { ColumnsService } from './columns.service.js';
import { BoardColumn } from './entities/column.entity.js';

@Module({
  // BoardsModule owns the Board entity and the ownership check; forFeature registers
  // BoardColumn for autoLoadEntities, while the service itself works through the DataSource.
  imports: [BoardsModule, TypeOrmModule.forFeature([BoardColumn])],
  providers: [ColumnsService],
  controllers: [ColumnsController],
})
export class ColumnsModule {}
