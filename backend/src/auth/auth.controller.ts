import { Body, Controller, HttpCode, HttpStatus, Post, Req, Res, UnauthorizedException } from '@nestjs/common';
import { ApiNoContentResponse, ApiOkResponse, ApiUnauthorizedResponse } from '@nestjs/swagger';

import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { Public } from '../common/decorators/public.decorator.js';
import { User } from '../users/entities/user.entity.js';
import { ConfigService } from '@nestjs/config';
import { EnvironmentVariables } from '../config/environment-variables.js';
import type { CookieOptions, Request, Response } from 'express';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly config: ConfigService<EnvironmentVariables, true>,
  ) {}

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ type: User, description: 'Logged in successfully' })
  @ApiUnauthorizedResponse({ description: 'Wrong login credentials' })
  async login(@Body() loginDto: LoginDto, @Res({ passthrough: true }) response: Response): Promise<User> {
    const { accessToken, refreshToken, user } = await this.authService.login(loginDto);

    this.setAccessCookie(response, accessToken);
    this.setRefreshCookie(response, refreshToken);

    return user;
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOkResponse({ description: 'Tokens successfully refreshed' })
  @ApiUnauthorizedResponse({ description: 'Refresh token is invalid' })
  async refresh(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token = this.extractRefreshToken(request);
    const { accessToken, refreshToken } = await this.authService.refresh(token);

    this.setAccessCookie(response, accessToken);
    this.setRefreshCookie(response, refreshToken);
  }

  @Public()
  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiNoContentResponse({ description: 'Session closed' })
  async logout(@Req() request: Request, @Res({ passthrough: true }) response: Response): Promise<void> {
    const token: unknown = request.cookies?.refreshToken;

    if (typeof token === 'string') {
      await this.authService.logout(token);
    }

    response.clearCookie('accessToken', this.accessCookieOptions);
    response.clearCookie('refreshToken', this.refreshCookieOptions);
  }

  private get accessCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: '/api',
    };
  }

  private get refreshCookieOptions(): CookieOptions {
    return {
      httpOnly: true,
      secure: this.config.get('NODE_ENV', { infer: true }) === 'production',
      sameSite: 'strict',
      path: '/api/auth',
    };
  }

  private setAccessCookie(response: Response, accessToken: string): void {
    const ttlMinutes = this.config.get('ACCESS_TOKEN_TTL_MINUTES', { infer: true });

    response.cookie('accessToken', accessToken, {
      ...this.accessCookieOptions,
      maxAge: ttlMinutes * 60 * 1000,
    });
  }

  private setRefreshCookie(response: Response, refreshToken: string): void {
    const ttlDays = this.config.get('REFRESH_TOKEN_TTL_DAYS', { infer: true });

    response.cookie('refreshToken', refreshToken, {
      ...this.refreshCookieOptions,
      maxAge: ttlDays * 24 * 60 * 60 * 1000,
    });
  }

  private extractRefreshToken(request: Request): string {
    const token: unknown = request.cookies?.refreshToken;

    if (typeof token !== 'string') {
      throw new UnauthorizedException('Refresh token is absent');
    }

    return token;
  }
}
