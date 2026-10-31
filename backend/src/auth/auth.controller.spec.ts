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
    ACCESS_TOKEN_TTL_MINUTES: 15,
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

const mockUser = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  username: 'testuser',
  email: 'user@example.com',
  passwordHash: '$2a$10$hashedpasswordvalue',
  avatarUrl: null,
  theme: 'dark',
  createdAt: new Date('2026-07-16T10:30:00.000Z'),
  updatedAt: new Date('2026-07-16T10:30:00.000Z'),
};

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
    const tokens = { accessToken: 'access-jwt', refreshToken: 'refresh-jwt', user: mockUser };

    beforeEach(() => {
      authService.login.mockResolvedValue(tokens);
    });

    it('should return user and set both accessToken and refreshToken cookies on response', async () => {
      const result = await controller.login(loginDto, res as unknown as Response);

      expect(result).toBe(mockUser);
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenNthCalledWith(1, 'accessToken', 'access-jwt', {
        httpOnly: true,
        secure: false, // NODE_ENV === 'development'
        sameSite: 'strict',
        path: '/api',
        maxAge: 15 * 60 * 1000, // 900_000 ms
      });
      expect(res.cookie).toHaveBeenNthCalledWith(2, 'refreshToken', 'refresh-jwt', {
        httpOnly: true,
        secure: false, // NODE_ENV === 'development'
        sameSite: 'strict',
        path: '/api/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000, // 604_800_000 ms
      });
    });

    it('should pass loginDto to authService.login', async () => {
      await controller.login(loginDto, res as unknown as Response);

      expect(authService.login).toHaveBeenCalledWith(loginDto);
      expect(authService.login).toHaveBeenCalledTimes(1);
    });

    it('should propagate error when authService.login throws and set no cookies', async () => {
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

    it('should extract refresh token from request.cookies and set new access and refresh cookies', async () => {
      const req = createMockRequest({ refreshToken: 'old-refresh' });

      await controller.refresh(req as unknown as Request, res as unknown as Response);

      expect(authService.refresh).toHaveBeenCalledWith('old-refresh');
      expect(res.cookie).toHaveBeenCalledTimes(2);
      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'new-access',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api',
        }),
      );
      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'new-refresh',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth',
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
    it('should call authService.logout and clear both cookies when refreshToken cookie is present', async () => {
      authService.logout.mockResolvedValue(undefined);
      const req = createMockRequest({ refreshToken: 'some-token' });

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).toHaveBeenCalledWith('some-token');
      expect(authService.logout).toHaveBeenCalledTimes(1);
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api',
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth',
        }),
      );
    });

    it('should NOT call authService.logout when no refreshToken cookie, but still clears both cookies', async () => {
      const req = createMockRequest({});

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ path: '/api' }));
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/api/auth' }));
    });

    it('should NOT throw when request.cookies is undefined, and still clear both cookies', async () => {
      const req = createMockRequest(undefined);

      await expect(controller.logout(req as unknown as Request, res as unknown as Response)).resolves.toBeUndefined();

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ path: '/api' }));
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/api/auth' }));
    });

    it('should NOT call authService.logout when refreshToken cookie is non-string', async () => {
      const req = createMockRequest({ refreshToken: 42 });

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(authService.logout).not.toHaveBeenCalled();
      expect(res.clearCookie).toHaveBeenCalledTimes(2);
      expect(res.clearCookie).toHaveBeenCalledWith('accessToken', expect.objectContaining({ path: '/api' }));
      expect(res.clearCookie).toHaveBeenCalledWith('refreshToken', expect.objectContaining({ path: '/api/auth' }));
    });
  });

  // -----------------------------------------------------------------------
  // Cookie security options (environment dependent)
  // -----------------------------------------------------------------------
  describe('cookie security options (tested indirectly via login)', () => {
    const loginDto: LoginDto = { email: 'u@e.com', password: 'pw' };
    const tokens = { accessToken: 'at', refreshToken: 'rt', user: mockUser };

    it('should set secure=true on both cookies in production', async () => {
      configService = createMockConfigService({ NODE_ENV: 'production' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue(tokens);

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'at', expect.objectContaining({ secure: true }));
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.objectContaining({ secure: true }));
    });

    it('should set secure=false on both cookies in non-production (development)', async () => {
      configService = createMockConfigService({ NODE_ENV: 'development' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue(tokens);

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'at', expect.objectContaining({ secure: false }));
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

      expect(res.cookie).toHaveBeenCalledWith('accessToken', 'at', expect.objectContaining({ secure: false }));
      expect(res.cookie).toHaveBeenCalledWith('refreshToken', 'rt', expect.objectContaining({ secure: false }));
    });
  });

  // -----------------------------------------------------------------------
  // Cookie maxAge calculations
  // -----------------------------------------------------------------------
  describe('cookie maxAge calculations', () => {
    const loginDto: LoginDto = { email: 'u@e.com', password: 'pw' };

    it('should compute accessToken maxAge correctly for ACCESS_TOKEN_TTL_MINUTES', async () => {
      configService = createMockConfigService({ ACCESS_TOKEN_TTL_MINUTES: 30 });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: mockUser });

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        'accessToken',
        'a',
        expect.objectContaining({ maxAge: 30 * 60 * 1000 }), // 1_800_000 ms
      );
    });

    it('should compute refreshToken maxAge correctly for REFRESH_TOKEN_TTL_DAYS', async () => {
      configService = createMockConfigService({ REFRESH_TOKEN_TTL_DAYS: 30 });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      authService.login.mockResolvedValue({ accessToken: 'a', refreshToken: 'r', user: mockUser });

      await controller.login(loginDto, res as unknown as Response);

      expect(res.cookie).toHaveBeenCalledWith(
        'refreshToken',
        'r',
        expect.objectContaining({ maxAge: 30 * 24 * 60 * 60 * 1000 }),
      );
    });
  });

  // -----------------------------------------------------------------------
  // logout cookie options consistency
  // -----------------------------------------------------------------------
  describe('logout cookie options consistency', () => {
    it('should pass secure=true to clearCookie for both cookies in production', async () => {
      configService = createMockConfigService({ NODE_ENV: 'production' });
      controller = new AuthController(
        authService as unknown as AuthService,
        configService as unknown as ConfigService<EnvironmentVariables, true>,
      );
      const req = createMockRequest({ refreshToken: 'tok' });
      authService.logout.mockResolvedValue(undefined);

      await controller.logout(req as unknown as Request, res as unknown as Response);

      expect(res.clearCookie).toHaveBeenCalledWith(
        'accessToken',
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          path: '/api',
        }),
      );
      expect(res.clearCookie).toHaveBeenCalledWith(
        'refreshToken',
        expect.objectContaining({
          secure: true,
          httpOnly: true,
          sameSite: 'strict',
          path: '/api/auth',
        }),
      );
    });
  });
});
