import { Body, Controller, Get, Patch } from '@nestjs/common';
import { UpdateProfileDto } from './dto/update-profile.dto.js';
import {
  ApiBadRequestResponse,
  ApiBearerAuth,
  ApiConflictResponse,
  ApiCookieAuth,
  ApiOkResponse,
  ApiUnauthorizedResponse,
} from '@nestjs/swagger';

import { User } from './entities/user.entity.js';
import { UsersService } from './users.service.js';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';

@ApiBearerAuth()
@ApiCookieAuth('accessToken')
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Patch('me')
  @ApiOkResponse({ type: User })
  @ApiBadRequestResponse({ description: 'Invalid username or email' })
  @ApiConflictResponse({ description: 'Email is already registered' })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  async updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateProfileDto): Promise<User> {
    return this.usersService.updateProfile(userId, dto);
  }

  @Get('me')
  @ApiOkResponse({ type: User })
  @ApiUnauthorizedResponse({ description: 'Authentication is required' })
  async me(@CurrentUser('sub') userId: string): Promise<User> {
    return this.usersService.findByIdOrFail(userId);
  }
}
