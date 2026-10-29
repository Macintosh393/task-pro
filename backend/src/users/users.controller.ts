import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOkResponse({ type: User })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  async me(@CurrentUser('sub') userId: string): Promise<User> {
    return this.usersService.findByIdOrFail(userId);
  }
}
