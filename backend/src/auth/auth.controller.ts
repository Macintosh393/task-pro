import { Body, Controller, HttpCode, HttpStatus, Post, Res } from '@nestjs/common';
import { ApiConflictResponse, ApiCreatedResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { User } from '../users/entities/user.entity.js';
import { LoginDto } from './dto/login.dto.js';
import { AccessTokenDto } from './dto/access-token.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/environment-variables.js';
import type { Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: AccessTokenDto })
  @ApiUnauthorizedResponse({ description: 'Wrong login credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<AccessTokenDto> {
    const { accessToken, refreshToken } = await this.authService.login(loginDto);

    response.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: '/auth',
      maxAge: this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true }) * 24 * 60 * 60 * 1000,
    });

    return { accessToken };
  }
}
