import { UnauthorizedException } from '@nestjs/common';

import { AuthController } from './auth.controller.js';
import type { AuthService } from './auth.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { ConfigService } from '@nestjs/config';
import type { EnvironmentVariables } from '../config/environment-variables.js';
import type { Request, Response } from 'express';

// ---------------------------------------------------------------------------
// Helpers to build mocks
// ---------------------------------------------------------------------------

function createMockAuthService(): Record<'login' | 'refresh' | 'logout', ReturnType<typeof vi.fn>> {
  return {
    login: vi.fn(),
    refresh: vi.fn(),
    logout: vi.fn(),
  };
}

function createMockConfigService(overrides: Partial<Record<string, unknown>> = {}) {
  const defaults: Record<string, unknown> = {
    NODE_ENV: 'development',
    REFRESH_TOKEN_TTL_DAYS: 7,
    ...overrides,
  };

  return {
    get: vi.fn((key: string) => defaults[key]),
  };
}

function createMockResponse(): Record<string, ReturnType<typeof vi.fn>> {
  return {
    cookie: vi.fn(),
    clearCookie: vi.fn(),
  };
}

function createMockRequest(cookies?: Record<string, unknown>): { cookies?: Record<string, unknown> } {
  return { cookies };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('AuthController', () => {
  let controller: AuthController;
  let authService: ReturnType<typeof createMockAuthService>;
  let configService: ReturnType<typeof createMockConfigService>;
  let res: ReturnType<typeof createMockResponse>;

  beforeEach(() => {
    authService = createMockAuthService();
    configService = createMockConfigService();
    res = createMockResponse();

    controller = new AuthController(
      authService as unknown as AuthService,
      configService as unknown as ConfigService<EnvironmentVariables, true>,
    );
  });

  // -----------------------------------------------------------------------
  // login()
  // -----------------------------------------------------------------------
  describe('login()', () => {
    const loginDto: LoginDto = { email: 'user@example.com', password: 's3cret' };
    const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt' };

    beforeEach(() => {
      authService.login.mockResolvedValue(tokens);
    });

    it('should return { accessToken } and set refresh cookie on response', async () => {
      const result = await controller.login(loginDto, res as unknown as Response);

      expect(result).toEqual({ accessToken: 'access-jwt' });
      expect(res.cookie).toHaveBeenCalledTimes(1);
    });

    it('should pass loginDto to authService.login', async () => {
      await controller.login(loginDto, res as unknown as Response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should call response.cookie with correct name, value, and options', async () => {
      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'refresh-jwt', {
        httpOnly: true,
        secure: false, // NODE_ENV === 'development'
        sameSite: 'strict',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 604_800_000 ms
      });
    });

    it('should propagate error when authService.login throws', async () => {
      const error = new UnauthorizedException('Wrong login credentials');
      authService.login.mockRejectedValue(error);

      await expect(controller.login(loginDto, res as unknown as Response)).rejects.toThrow(error);
      expect(res.cookie).not.toHaveBeenCalled();
    });
  });

  // -----------------------------------------------------------------------
  // refresh()
  // -----------------------------------------------------------------------
  describe('refresh()', () => {
    const tokens = { accessToken: 'new-access', refreshToken: 'new-refresh' };

    beforeEach(() => {
      authService.refresh.mockResolvedValue(tokens);
    });

    it('should extract refresh token from request.cookies and return new { accessToken }', async () => {
      const req = createMockRequest({ refreshToken: 'old-refresh' });

      const result = await controller.refresh(req as unknown as Request, res as unknown as Response);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(result).toEqual({ accessToken: 'new-access' });
    });

    it('should set new refresh cookie on response', async () => {
      const req = createMockRequest({ refreshToken: 'old-refresh' });

      await controller.refresh(req as unknown as Request, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      );
    });

    it('should throw UnauthorizedException when no refreshToken cookie is present', async () => {
      const req = createMockRequest({});

      await expect(controller.refresh(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        UnauthorizedException,
      );

      await expect(controller.refresh(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        'Refresh token is absent',
      );
    });

    it('should throw UnauthorizedException when refreshToken cookie is non-string (number)', async () => {
      const req = createMockRequest({ refreshToken: 12345 });

      await expect(controller.refresh(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        UnauthorizedException,
      );
    });

    it('should throw UnauthorizedException when request.cookies is undefined', async () => {
      const req = createMockRequest(undefined);

      await expect(controller.refresh(req as unknown as Request, res as unknown as Response)).rejects.toThrow(
        'Refresh token is absent',
      );
    });

    it('should propagate error when authService.refresh throws', async () => {
      const req = createMockRequest({ refreshToken: 'old-refresh' });
      const error = new UnauthorizedException('Refresh token is invalid');
      authService.refresh.mockRejectedValue(error);

      await expect(controller.refresh(req as unknown as Request, res as unknown as Response)).rejects.toThrow(error);
    });
  });

  // -----------------------------------------------------------------------
  // logout()
  // -----------------------------------------------------------------------
  describe('logout()', () => {
    it('should call authService.logout and clear cookie when refreshToken cookie is present', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = createMockRequest({ refreshToken: 'some-token' });

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).toHaveBeenCalledWith('some-token');
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      );
    });

    it('should NOT call authService.logout when no refreshToken cookie, still clears cookie', async () => {
      const req = createMockRequest({});

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      );
    });

    it('should NOT throw when request.cookies is undefined, still clears cookie', async () => {
      const req = createMockRequest(undefined);

      await expect(controller.logout(req as unknown as Request, res as unknown as Response)).resolves.toBeUndefined();

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(1);
    });

    it('should NOT call authService.logout when refreshToken cookie is non-string', async () => {
      const req = createMockRequest({ refreshToken: 42 });

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(1);
    });
  });

  // -----------------------------------------------------------------------
  // refreshCookieOptions (private getter, tested indirectly)
  // -----------------------------------------------------------------------
  describe('refreshCookieOptions (tested indirectly via login)', () => {
    const loginDto: LoginDto = { email: 'u@e.com', password: 'pw' };
    const tokens = { accessToken: 'at', refreshToken: 'rt' };

    it('should set secure=true in production', async () => {
      configService = createMockConfigService({ NODE_ENV: 'production' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue(tokens);

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.objectContaining({ secure: true }));
    });

    it('should set secure=false in non-production (development)', async () => {
      configService = createMockConfigService({ NODE_ENV: 'development' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue(tokens);

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.objectContaining({ secure: false }));
    });

    it('should set secure=false when NODE_ENV is "test"', async () => {
      configService = createMockConfigService({ NODE_ENV: 'test' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue(tokens);

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.objectContaining({ secure: false }));
    });
  });

  // -----------------------------------------------------------------------
  // setRefreshCookie (private, tested indirectly)
  // -----------------------------------------------------------------------
  describe('setRefreshCookie (tested indirectly via login)', () => {
    const loginDto: LoginDto = { email: 'u@e.com', password: 'pw' };

    it('should compute maxAge correctly for 7 days (604800000 ms)', async () => {
      configService = createMockConfigService({ REFRESH_TOKEN_TTL_DAYS: 7 });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'r', expect.objectContaining({ maxAge: 604_800_000 }));
    });

    it('should compute maxAge correctly for 30 days (2592000000 ms)', async () => {
      configService = createMockConfigService({ REFRESH_TOKEN_TTL_DAYS: 30 });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'r',
        expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000 }),
      );
    });

    it('should compute maxAge correctly for 1 day (86400000 ms)', async () => {
      configService = createMockConfigService({ REFRESH_TOKEN_TTL_DAYS: 1 });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r' });

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'r', expect.objectContaining({ maxAge: 86_400_000 }));
    });
  });

  // -----------------------------------------------------------------------
  // refreshCookieOptions used consistently in logout clearCookie
  // -----------------------------------------------------------------------
  describe('logout refreshCookieOptions consistency', () => {
    it('should pass secure=true to clearCookie in production', async () => {
      configService = createMockConfigService({ NODE_ENV: 'production' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      const req = createMockRequest({ refreshToken: 'tok' });
      authService.logout.mockResolvedValue(undefined);

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          path: '/auth',
        }),
      );
    });

    it('should pass secure=false to clearCookie in development', async () => {
      configService = createMockConfigService({ NODE_ENV: 'development' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      const req = createMockRequest({ refreshToken: 'tok' });
      authService.logout.mockResolvedValue(undefined);

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          secure: false,
        }),
      );
    });
  });
});
