import { ClassSerializerInterceptor, INestApplication, ValidationPipe } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { QueryFailedError } from 'typeorm';
import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { User } from '../src/users/entities/user.entity.js';
import { UsersController } from '../src/users/users.controller.js';
import { UsersService } from '../src/users/users.service.js';

describe('Profile (e2e)', () => {
  let app: INestApplication<App>;
  let users: User[];
  const jwt = new JwtService({ secret: 'profile-test-secret' });
  const repository = {
    findOne: vi.fn(
      async ({ where }: { where: Partial<User> }) =>
        users.find((user) => Object.entries(where).every(([key, value]) => user[key] === value)) ?? null,
    ),
    update: vi.fn(async (id: string, data: Partial<User>) => {
      Object.assign(
        users.find((user) => user.id === id)!,
        data,
      );
      return { affected: 1 };
    }),
  };
  const profile = { username: 'Updated name', email: 'updated@example.com' };
  const auth = () => `Bearer ${jwt.sign({ sub: 'self' })}`;

  beforeEach(async () => {
    vi.clearAllMocks();
    users = ['self', 'other'].map((id) =>
      Object.assign(new User(), {
        id,
        username: id,
        email: `${id}@example.com`,
        passwordHash: 'private-hash',
        avatarUrl: null,
        theme: 'dark',
      }),
    );
    const module = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [
        UsersService,
        { provide: getRepositoryToken(User), useValue: repository },
        { provide: JwtService, useValue: jwt },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();
    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  it('normalizes and saves only the authenticated profile, then reads it back without secrets', async () => {
    const response = await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', auth())
      .send({ username: ' Updated name ', email: ' Updated@Example.COM ' })
      .expect(200);
    expect(response.body).toMatchObject({ id: 'self', ...profile });
    expect(response.body).not.toHaveProperty('passwordHash');
    expect(users[1].username).toBe('other');
    expect(users[0].passwordHash).toBe('private-hash');
    expect(users[0].theme).toBe('dark');
    const read = await request(app.getHttpServer()).get('/api/users/me').set('Authorization', auth()).expect(200);
    expect(read.body).toEqual(response.body);
  });

  it('allows keeping the current email', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', auth())
      .send({ ...profile, email: 'self@example.com' })
      .expect(200);
  });

  it('rejects an occupied email without changing the name', async () => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', auth())
      .send({ ...profile, email: 'OTHER@example.com' })
      .expect(409);
    expect(users[0].username).toBe('self');
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('handles a concurrent email conflict without a partial write', async () => {
    repository.update.mockRejectedValueOnce(new QueryFailedError('UPDATE users', [], { code: '23505' } as Error));
    await request(app.getHttpServer()).patch('/api/users/me').set('Authorization', auth()).send(profile).expect(409);
    expect(users[0].username).toBe('self');
  });

  it.each([
    { username: '   ' },
    { username: 'x'.repeat(33) },
    { username: '\u2764\uFE0F'.repeat(32) },
    { username: 'User\u0000name' },
    { username: null },
    { email: 'invalid' },
    { email: null },
    { id: 'other' },
    { passwordHash: 'changed' },
    { theme: 'light' },
  ])('rejects invalid or forbidden data: %j', async (invalid) => {
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', auth())
      .send({ ...profile, ...invalid })
      .expect(400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it.each(['a'.repeat(32), '\u2764\uFE0F'.repeat(16), '\u{1F600}'.repeat(32)])(
    'accepts usernames with at most 32 database code points: %s',
    async (username) => {
      const response = await request(app.getHttpServer())
        .patch('/api/users/me')
        .set('Authorization', auth())
        .send({ ...profile, username })
        .expect(200);
      expect(response.body.username).toBe(username);
    },
  );

  it('requires both profile fields', async () => {
    await request(app.getHttpServer()).patch('/api/users/me').set('Authorization', auth()).send({}).expect(400);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('rejects missing or invalid authorization', async () => {
    await request(app.getHttpServer()).patch('/api/users/me').send(profile).expect(401);
    await request(app.getHttpServer())
      .patch('/api/users/me')
      .set('Authorization', 'Bearer invalid')
      .send(profile)
      .expect(401);
    expect(repository.update).not.toHaveBeenCalled();
  });

  it('does not expose an endpoint for editing another user', async () => {
    await request(app.getHttpServer()).patch('/api/users/other').set('Authorization', auth()).send(profile).expect(404);
    expect(repository.update).not.toHaveBeenCalled();
  });
});
