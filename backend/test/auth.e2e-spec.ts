import { ConflictException, INestApplication, ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { AuthController } from '../src/auth/auth.controller.js';
import { AuthService } from '../src/auth/auth.service.js';

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
          provide: AuthService,
          useValue: authService,
        },
      ],
    }).compile();

    app = module.createNestApplication();

    app.setGlobalPrefix('api');
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );

    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('registers a user successfully', async () => {
    const user = {
      id: 'user-123',
      name: 'Test User',
      email: 'test@example.com',
    };

    authService.register.mockResolvedValue(user);

    const response = await request(app.getHttpServer()).post('/api/auth/register').send(registrationData).expect(201);

    expect(response.body).toEqual(user);
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

  it('rejects an already registered email', async () => {
    authService.register.mockRejectedValue(new ConflictException('Email is already registered'));

    const response = await request(app.getHttpServer()).post('/api/auth/register').send(registrationData).expect(409);

    expect(response.body.message).toBe('Email is already registered');
  });
});
