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
import { BoardsService } from './boards.service.js';
import { CreateBoardDto } from './dto/create-board.dto.js';
import { Board } from './entities/board.entity.js';

@ApiBearerAuth()
@ApiCookieAuth('accessToken')
@ApiUnauthorizedResponse({ description: 'Authentication is required' })
@Controller('boards')
export class BoardsController {
  constructor(private readonly boardsService: BoardsService) {}

  @Post()
  @ApiCreatedResponse({ type: Board })
  @ApiBadRequestResponse({ description: 'Invalid title, icon or background' })
  create(@CurrentUser('sub') userId: string, @Body() dto: CreateBoardDto): Promise<Board> {
    return this.boardsService.create(userId, dto);
  }

  @Get()
  @ApiOkResponse({ type: Board, isArray: true, description: 'Own boards, oldest first' })
  findAll(@CurrentUser('sub') userId: string): Promise<Board[]> {
    return this.boardsService.findAllByUser(userId);
  }

  @Get(':id')
  @ApiOkResponse({ type: Board })
  @ApiBadRequestResponse({ description: 'Board id is not a UUID' })
  @ApiNotFoundResponse({ description: 'Board does not exist or belongs to another user' })
  findOne(@CurrentUser('sub') userId: string, @Param('id', new ParseUUIDPipe()) id: string): Promise<Board> {
    return this.boardsService.findOneOwnedOrFail(userId, id);
  }
}
