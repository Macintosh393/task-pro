import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import type { Request } from 'express';

import { IS_PUBLIC_KEY } from '../common/decorators/public.decorator.js';
import { JwtPayload } from './jwt-payload.interface.js';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly jwtService: JwtService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    const token = this.extractToken(request);

    if (token === null) {
      throw new UnauthorizedException('Authentication is required');
    }

    try {
      request.user = await this.jwtService.verifyAsync<JwtPayload>(token);
    } catch {
      throw new UnauthorizedException('Token is invalid or expired');
    }

    return true;
  }

  private extractToken(request: Request): string | null {
    const cookieToken: unknown = request.cookies?.accessToken;
    if (typeof cookieToken === 'string' && cookieToken.trim().length > 0) {
      return cookieToken;
    }

    const [type, token] = request.headers.authorization?.split(' ') ?? [];

    return type === 'Bearer' && token ? token : null;
  }
}
