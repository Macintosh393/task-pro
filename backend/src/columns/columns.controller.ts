import { Body, Controller, Get, Param, ParseUUIDPipe, Post } from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiCookieAuth,
  ApiCreatedResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import { ColumnsService } from './columns.service.js';
import { CreateColumnDto } from './dto/create-column.dto.js';
import { BoardColumn } from './entities/column.entity.js';

@ApiBearerAuth()
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Authentication is required' })
@ApiNotFoundResponse({ description: 'Board does not exist or belongs to another user' })
@Controller('boards/:boardId/columns')
export class ColumnsController {
  constructor(private readonly columnsService: ColumnsService) {}

  @Post()
  @ApiCreatedResponse({ type: BoardColumn, description: 'The new column, placed after the existing ones' })
  @ApiBadRequestResponse({ description: 'Invalid title or board id is not a UUID' })
  create(
    @CurrentUser('sub') userId: string,
    @Param('boardId', new ParseUUIDPipe()) boardId: string,
    @Body() dto: CreateColumnDto,
  ): Promise<BoardColumn> {
    return this.columnsService.create(userId, boardId, dto);
  }

  @Get()
  @ApiOkResponse({ type: BoardColumn, isArray: true, description: 'Columns of the board in their stored order' })
  @ApiBadRequestResponse({ description: 'Board id is not a UUID' })
  findAll(
    @CurrentUser('sub') userId: string,
    @Param('boardId', new ParseUUIDPipe()) boardId: string,
  ): Promise<BoardColumn[]> {
    return this.columnsService.findAllByBoard(userId, boardId);
  }
}
