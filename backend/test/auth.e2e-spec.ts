import { ClassSerializerInterceptor, ConflictException, INestApplication } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { User } from '../src/users/entities/user.entity.js';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';
import { createGlobalPipes } from '../src/common/pipes/create-global-pipes.js';

describe('AuthController (e2e)', () => {
  let app: INestApplication<App>;

  const authService = {
    register: vi.fn(),
  };

  const registrationData = {
    name: 'Test User',
    email: 'test@example.com',
    password: 'TestPassword123!',
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module = await Test.createTestingModule({
      controllers: [AuthController],
      providers: [
        {
          provide: ConfigService,
          useValue: {
            get: (key: string) => ({ NODE_ENV: 'test', ACCESS_TOKEN_TTL_MINUTES: 15, REFRESH_TOKEN_TTL_DAYS: 7 })[key],
          },
        },
        {
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    app.useGlobalPipes(...createGlobalPipes());

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a user successfully', async () => {
    const user = Object.assign(new User(), {
      id: 'user-123',
      username: 'Test User',
      email: 'test@example.com',
      passwordHash: 'hidden-hash',
    });

    authService.register.mockResolvedValue({ user, accessToken: 'access-token', refreshToken: 'refresh-token' });

    const response = await request(app.getHttpServer()).post('/api/auth/register').send(registrationData).expect(201);

    expect(response.body).toEqual({ id: user.id, username: user.username, email: user.email });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(response.headers['set-cookie']).toEqual(
      expect.arrayContaining([
        expect.stringContaining('accessToken=access-token;'),
        expect.stringContaining('refreshToken=refresh-token;'),
      ]),
    );
    expect(authService.register).toHaveBeenCalledWith(registrationData);
  });

  it('rejects invalid registration data', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({
        ...registrationData,
        name: '   ',
        email: 'invalid-email',
      })
      .expect(400);

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('normalizes the name to NFC but passes the password through unchanged', async () => {
    authService.register.mockResolvedValue({
      user: Object.assign(new User(), { id: 'user-123', username: 'Zoë', email: registrationData.email }),
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...registrationData, name: 'Zoë', password: 'Pássword-123' })
      .expect(201);

    expect(authService.register).toHaveBeenCalledWith({
      ...registrationData,
      name: 'Zoë',
      password: 'Pássword-123',
    });
  });

  it('rejects a name longer than 32 code points even when validator undercounts it', async () => {
    await request(app.getHttpServer())
      .post('/api/auth/register')
      .send({ ...registrationData, name: '❤️'.repeat(17) })
      .expect(400);

    expect(authService.register).not.toHaveBeenCalled();
  });

  it('rejects an already registered email', async () => {
    authService.register.mockRejectedValue(new ConflictException('Email is already registered'));

    const response = await request(app.getHttpServer()).post('/api/auth/register').send(registrationData).expect(409);

    expect(response.body.message).toBe('Email is already registered');
  });
});
