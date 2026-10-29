import { UnauthorizedException } from '@nestjs/common';
import type { ExecutionContext } from '@nestjs/common';
import type { Reflector } from '@nestjs/core';
import type { JwtService } from '@nestjs/jwt';

import { JwtAuthGuard } from './jwt-auth.guard.js';
import type { JwtPayload } from './jwt-payload.interface.js';

function createMockExecutionContext(authorization?: string) {
  const request: { headers: { authorization?: string }; user?: JwtPayload } = {
    headers: {},
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

    it('should throw UnauthorizedException when no Authorization header is present', async () => {
      const { context } = createMockExecutionContext();

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
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

    it('should return true and set request.user when Bearer token is valid', async () => {
      const { context, request } = createMockExecutionContext('Bearer valid.jwt.token');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockPayload);
    });

    it('should throw UnauthorizedException when jwtService.verifyAsync throws', async () => {
      jwtService.verifyAsync.mockRejectedValue(new Error('jwt expired'));
      const { context } = createMockExecutionContext('Bearer expired.jwt.token');

      await expect(guard.canActivate(context)).rejects.toThrow(
        new UnauthorizedException('Token is invalid or expired'),
      );
    });

    it('should call jwtService.verifyAsync with the extracted token string', async () => {
      const { context } = createMockExecutionContext('Bearer my-secret-token');

      await guard.canActivate(context);

      expect(jwtService.verifyAsync).toHaveBeenCalledOnce();
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('my-secret-token');
    });

    it('should set request.user to the exact payload returned by verifyAsync', async () => {
      const customPayload: JwtPayload = { sub: 'custom-user', iat: 111, exp: 222 };
      jwtService.verifyAsync.mockResolvedValue(customPayload);
      const { context, request } = createMockExecutionContext('Bearer some.token');

      await guard.canActivate(context);

      expect(request.user).toBe(customPayload);
    });
  });

  describe('extractToken() (tested indirectly via canActivate)', () => {
    it('should treat undefined authorization header as null token and throw', async () => {
      const { context } = createMockExecutionContext(undefined);

      await expect(guard.canActivate(context)).rejects.toThrow(new UnauthorizedException('Authentication is required'));
      expect(jwtService.verifyAsync).not.toHaveBeenCalled();
    });

    it('should handle multiple spaces in authorization header — only first split element matters', async () => {
      // "Bearer token with spaces" splits to ["Bearer", "token", "with", "spaces"]
      // The guard destructures [type, token] so token = "token" (second element)
      const { context, request } = createMockExecutionContext('Bearer token with spaces');

      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(jwtService.verifyAsync).toHaveBeenCalledWith('token');
      expect(request.user).toEqual(mockPayload);
    });
  });
});
