import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { JwtPayload } from './jwt-payload.interface.js';

function createMockExecutionContext(authorization?: string, cookies?: Record<string, unknown>) {
  const request: {
    headers: { authorization?: string };
    cookies?: Record<string, unknown>;
    user?: JwtPayload;
  } = {
    headers: {},
    cookies,
  };

  if (authorization !== undefined) {
    request.headers.authorization = authorization;
  }

  const context = {
    getHandler: vi.fn().mockReturnValue(() => {}),
    getClass: vi.fn().mockReturnValue(class {}),
    switchToHttp: vi.fn().mockReturnValue({
      getRequest: vi.fn().mockReturnValue(request),
    }),
  } as unknown as ExecutionContext;

  return { context, request };
}

describe('JwtAuthGuard', () => {
  let guard: JwtAuthGuard;
  let reflector: { getAllAndOverride: ReturnType<typeof vi.fn> };
  let jwtService: { verifyAsync: ReturnType<typeof vi.fn> };

  const mockPayload: JwtPayload = {
    sub: 'user-123',
    iat: 1700000000,
    exp: 1700003600,
  };

  beforeEach(() => {
    reflector = { getAllAndOverride: vi.fn().mockReturnValue(false) };
    jwtService = { verifyAsync: vi.fn().mockResolvedValue(mockPayload) };

    guard = new JwtAuthGuard(reflector as unknown as Reflector, jwtService as unknown as JwtService);
  });

  describe('canActivate()', () => {
    it('should return true for public routes without checking the token', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const { context } = createMockExecutionContext();

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
      expect(context.switchToHttp).not.toHaveBeenCalled();
    });

    it('should pass handler and class to reflector.getAllAndOverride', async () => {
      reflector.getAllAndOverride.mockReturnValue(true);
      const { context } = createMockExecutionContext();

      await guard.canActivate(context);

      expect(reflector.getAllAndOverride).toHaveBeenCalledWith('isPublic', [context.getHandler(), context.getClass()]);
    });

    it('should throw UnauthorizedException when neither cookie nor Authorization header is present', async () => {
      const { context } = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
    });

    it('should return true and set request.user when valid token is in accessToken cookie', async () => {
      const { context, request } = createMockExecutionContext(undefined, { accessToken: 'cookie.jwt.token' });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie.jwt.token');
      expect(request.user).toEqual(mockPayload);
    });

    it('should prioritize accessToken cookie over Authorization header', async () => {
      const { context, request } = createMockExecutionContext('Bearer header.token', {
        accessToken: 'cookie.token',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('cookie.token');
      expect(request.user).toEqual(mockPayload);
    });

    it('should fallback to Authorization header when accessToken cookie is absent', async () => {
      const { context, request } = createMockExecutionContext('Bearer valid.jwt.token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('valid.jwt.token');
      expect(request.user).toEqual(mockPayload);
    });

    it('should fallback to Authorization header when accessToken cookie is empty string', async () => {
      const { context, request } = createMockExecutionContext('Bearer fallback.token', {
        accessToken: '',
      });

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('fallback.token');
      expect(request.user).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when Authorization header uses wrong scheme (e.g. "Basic xyz")', async () => {
      const { context } = createMockExecutionContext('Basic xyz');

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
    });

    it('should throw UnauthorizedException when Authorization header is "Bearer " (empty token after Bearer)', async () => {
      const { context } = createMockExecutionContext('Bearer ');

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
    });

    it('should throw UnauthorizedException when Authorization header is only "Bearer" (no space, no token)', async () => {
      const { context } = createMockExecutionContext('Bearer');

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
    });

    it('should throw UnauthorizedException when jwtService.verifyAsync throws', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const { context } = createMockExecutionContext(undefined, { accessToken: 'expired.jwt.token' });

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token is invalid or expired'),
      );
    });

    it('should set request.user to the exact payload returned by verifyAsync', async () => {
      const customPayload: JwtPayload = { sub: 'custom-user', iat: 111, exp: 222 };
      jwtService.verifyAsync.mockResolvedValue(customPayload);
      const { context, request } = createMockExecutionContext(undefined, { accessToken: 'some.token' });

      await guard.canActivate(context);

      expect(request.user).toBe(customPayload);
    });
  });

  describe('extractToken() (tested indirectly via canActivate)', () => {
    it('should treat undefined authorization header and cookies as null token and throw', async () => {
      const { context } = createMockExecutionContext(undefined, undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should handle multiple spaces in authorization header — only first split element matters', async () => {
      const { context, request } = createMockExecutionContext('Bearer token with spaces');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token');
      expect(request.user).toEqual(mockPayload);
    });
  });
});
