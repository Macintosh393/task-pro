import { randomUUID } from 'node:crypto';

import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';

import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { BoardsController } from '../src/boards/boards.controller.js';
import { BoardsService } from '../src/boards/boards.service.js';
import { BOARD_BACKGROUNDS, BOARD_ICONS } from '../src/boards/board-options.js';
import { Board } from '../src/boards/entities/board.entity.js';
import { createGlobalPipes } from '../src/common/pipes/create-global-pipes.js';

const JWT_SECRET = 'test-secret';

type Where = Partial<Pick<Board, 'id' | 'userId'>>;
type Order = Partial<Record<'createdAt' | 'id', 'ASC' | 'DESC'>>;

/**
 * Stateful in-memory stand-in for Repository<Board>. It honours `where` (AND of
 * equality checks; uuid comparison is case-insensitive like Postgres) and the
 * `order` option passed by the caller (createdAt, id; first key wins), which is
 * all BoardsService relies on. Without `order`, rows come back in insertion order.
 */
function createFakeBoardsRepository() {
  const rows: Board[] = [];
  const clock = { now: new Date('2026-01-01T00:00:00.000Z') };

  const matches = (board: Board, where: Where) =>
    Object.entries(where).every(
      ([key, value]) => String(board[key as keyof Where]).toLowerCase() === String(value).toLowerCase(),
    );

  const compare = (a: Board, b: Board, order: Order) => {
    for (const [key, direction] of Object.entries(order) as [keyof Order, 'ASC' | 'DESC'][]) {
      const diff = key === 'createdAt' ? a.createdAt.getTime() - b.createdAt.getTime() : a[key].localeCompare(b[key]);

      if (diff !== 0) {
        return direction === 'DESC' ? -diff : diff;
      }
    }

    return 0;
  };

  return {
    rows,
    clock,
    create: vi.fn((data: Partial<Board>) => Object.assign(new Board(), data)),
    save: vi.fn((board: Board) => {
      const stored = Object.assign(new Board(), board, {
        id: randomUUID(),
        createdAt: new Date(clock.now),
        updatedAt: new Date(clock.now),
      });
      rows.push(stored);

      return Promise.resolve(Object.assign(new Board(), stored));
    }),
    find: vi.fn(({ where, order = {} }: { where: Where; order?: Order }) => {
      const result = rows.filter((board) => matches(board, where)).sort((a, b) => compare(a, b, order));

      return Promise.resolve(result.map((board) => Object.assign(new Board(), board)));
    }),
    findOne: vi.fn(({ where }: { where: Where }) => {
      const found = rows.find((board) => matches(board, where));

      return Promise.resolve(found ? Object.assign(new Board(), found) : null);
    }),
  };
}

describe('BoardsController (e2e)', () => {
  let app: INestApplication<App>;
  let repository: ReturnType<typeof createFakeBoardsRepository>;
  let jwtService: JwtService;

  const userA = randomUUID();
  const userB = randomUUID();
  const tokenFor = (sub: string) => jwtService.sign({ sub });
  const bearer = (sub: string) => ({ Authorization: `Bearer ${tokenFor(sub)}` });

  const createBoard = (sub: string, body: Record<string, unknown> = { title: 'Board' }) =>
    request(app.getHttpServer()).post('/api/boards').set(bearer(sub)).send(body);

  beforeEach(async () => {
    repository = createFakeBoardsRepository();

    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '15m' } })],
      controllers: [BoardsController],
      providers: [
        BoardsService,
        { provide: getRepositoryToken(Board), useValue: repository },
        { provide: APP_GUARD, useClass: JwtAuthGuard },
      ],
    }).compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('api');
    app.use(cookieParser());
    app.useGlobalPipes(...createGlobalPipes());
    app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
    await app.init();

    jwtService = app.get(JwtService);
  });

  afterEach(async () => {
    await app.close();
  });

  describe('authentication', () => {
    const someId = randomUUID();
    const routes = [
      ['POST /api/boards', (r: request.Agent) => r.post('/api/boards').send({ title: 'Board' })],
      ['GET /api/boards', (r: request.Agent) => r.get('/api/boards')],
      [`GET /api/boards/:id`, (r: request.Agent) => r.get(`/api/boards/${someId}`)],
    ] as const;

    it.each(routes)('%s rejects a request without credentials', async (_name, send) => {
      await send(request.agent(app.getHttpServer())).expect(401);

      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.find).not.toHaveBeenCalled();
      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it.each(routes)('%s rejects a garbage token', async (_name, send) => {
      await send(request.agent(app.getHttpServer())).set('Authorization', 'Bearer not-a-jwt').expect(401);
    });

    it.each(routes)('%s rejects an expired token', async (_name, send) => {
      const expired = jwtService.sign({ sub: userA }, { expiresIn: -10 });

      await send(request.agent(app.getHttpServer())).set('Authorization', `Bearer ${expired}`).expect(401);
    });

    it.each(routes)('%s rejects a token signed with another secret', async (_name, send) => {
      const forged = new JwtService({ secret: 'another-secret' }).sign({ sub: userA });

      await send(request.agent(app.getHttpServer())).set('Authorization', `Bearer ${forged}`).expect(401);
    });

    it('rejects a non-Bearer authorization scheme', async () => {
      await request(app.getHttpServer())
        .get('/api/boards')
        .set('Authorization', `Basic ${tokenFor(userA)}`)
        .expect(401);
    });

    it('accepts the access token from the accessToken cookie', async () => {
      await request(app.getHttpServer())
        .get('/api/boards')
        .set('Cookie', `accessToken=${tokenFor(userA)}`)
        .expect(200);
    });

    it('accepts the access token from the Authorization header', async () => {
      await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);
    });
  });

  describe('create → read', () => {
    it('creates a board and returns it with the saved title, icon and background', async () => {
      const response = await createBoard(userA, { title: 'Roadmap', icon: 'star', background: 'bg-03' }).expect(201);

      expect(response.body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        title: 'Roadmap',
        icon: 'star',
        background: 'bg-03',
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
    });

    it('defaults to the first icon and no background', async () => {
      const response = await createBoard(userA, { title: 'Roadmap' }).expect(201);

      expect(response.body).toMatchObject({ icon: 'project', background: 'none' });
    });

    it('trims the title before storing it', async () => {
      const response = await createBoard(userA, { title: '  Roadmap  ' }).expect(201);

      expect(response.body.title).toBe('Roadmap');
      expect(repository.rows[0].title).toBe('Roadmap');
    });

    it('never exposes the owner', async () => {
      const created = await createBoard(userA).expect(201);
      const read = await request(app.getHttpServer()).get(`/api/boards/${created.body.id}`).set(bearer(userA));
      const list = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA));

      for (const body of [created.body, read.body, list.body[0]]) {
        expect(body).not.toHaveProperty('userId');
        expect(body).not.toHaveProperty('user');
      }
      expect(repository.rows[0].userId).toBe(userA);
    });

    it('reads the created board back by id with identical data', async () => {
      const created = await createBoard(userA, { title: 'Roadmap', icon: 'hexagon', background: 'bg-15' }).expect(201);

      const read = await request(app.getHttpServer())
        .get(`/api/boards/${created.body.id}`)
        .set(bearer(userA))
        .expect(200);

      expect(read.body).toEqual(created.body);
    });

    it('includes the created board in the list', async () => {
      const created = await createBoard(userA, { title: 'Roadmap' }).expect(201);

      const list = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);

      expect(list.body).toEqual([created.body]);
    });

    it('persists every allowed icon and background combination edge (first and last of each)', async () => {
      const icons = [BOARD_ICONS[0], BOARD_ICONS[BOARD_ICONS.length - 1]];
      const backgrounds = [BOARD_BACKGROUNDS[0], BOARD_BACKGROUNDS[BOARD_BACKGROUNDS.length - 1]];

      for (const icon of icons) {
        for (const background of backgrounds) {
          const response = await createBoard(userA, { title: 'Board', icon, background }).expect(201);

          expect(response.body).toMatchObject({ icon, background });
        }
      }
    });

    it('allows duplicate titles for the same user', async () => {
      const first = await createBoard(userA, { title: 'Same' }).expect(201);
      const second = await createBoard(userA, { title: 'Same' }).expect(201);

      expect(first.body.id).not.toBe(second.body.id);
    });
  });

  describe('list', () => {
    it('returns an empty array when the user has no boards', async () => {
      const response = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);

      expect(response.body).toEqual([]);
    });

    it('returns boards oldest first', async () => {
      // Stored out of chronological order, so only the query's ORDER BY can produce the expected sequence.
      const base = new Date('2026-01-01T00:00:00.000Z').getTime();
      const stored: [title: string, offsetMs: number][] = [
        ['second', 1000],
        ['third', 2000],
        ['first', 0],
      ];
      for (const [title, offsetMs] of stored) {
        repository.clock.now = new Date(base + offsetMs);
        await createBoard(userA, { title }).expect(201);
      }

      const response = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);

      expect(response.body.map((board: { title: string }) => board.title)).toEqual(['first', 'second', 'third']);
    });

    it('orders boards created at the same instant deterministically by id', async () => {
      for (const title of ['a', 'b', 'c', 'd']) {
        await createBoard(userA, { title }).expect(201);
      }

      const first = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);
      const second = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);
      const ids: string[] = first.body.map((board: { id: string }) => board.id);

      expect(ids).toEqual([...ids].sort());
      expect(second.body).toEqual(first.body);
    });
  });

  describe('validation', () => {
    const invalidBodies: [string, unknown][] = [
      ['an empty body', {}],
      ['a missing title', { icon: 'star' }],
      ['an empty title', { title: '' }],
      ['a whitespace-only title', { title: '   ' }],
      ['a 256-character title', { title: 'a'.repeat(256) }],
      ['a title with a null character', { title: 'Road\u0000map' }],
      // 400 code points: validator's isLength counts each ❤️ as one, PostgreSQL varchar(255) as two.
      ['a title of 200 emoji with variation selectors', { title: '❤️'.repeat(200) }],
      ['a numeric title', { title: 42 }],
      ['a null title', { title: null }],
      ['an unknown icon', { title: 'Board', icon: 'rocket' }],
      ['a null icon', { title: 'Board', icon: null }],
      ['an unknown background', { title: 'Board', background: 'bg-16' }],
      ['a null background', { title: 'Board', background: null }],
      ['a userId field', { title: 'Board', userId: userB }],
      ['an id field', { title: 'Board', id: randomUUID() }],
      ['an iconId field', { title: 'Board', iconId: 'star' }],
      ['a createdAt field', { title: 'Board', createdAt: '2020-01-01T00:00:00.000Z' }],
    ];

    it.each(invalidBodies)('rejects %s with 400 and stores nothing', async (_label, body) => {
      await createBoard(userA, body as Record<string, unknown>).expect(400);

      expect(repository.save).not.toHaveBeenCalled();
      expect(repository.rows).toHaveLength(0);
    });

    it('rejects malformed JSON with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/boards')
        .set(bearer(userA))
        .set('Content-Type', 'application/json')
        .send('{"title": ')
        .expect(400);

      expect(repository.save).not.toHaveBeenCalled();
    });

    it('rejects a non-object JSON body with 400', async () => {
      await request(app.getHttpServer())
        .post('/api/boards')
        .set(bearer(userA))
        .set('Content-Type', 'application/json')
        .send('"just a string"')
        .expect(400);
    });

    it('accepts a title of exactly 255 characters', async () => {
      await createBoard(userA, { title: 'a'.repeat(255) }).expect(201);
    });

    it('accepts a title of exactly 255 code points including variation selectors', async () => {
      await createBoard(userA, { title: `${'❤️'.repeat(127)}a` }).expect(201);
    });

    it('stores the title in Unicode NFC', async () => {
      const response = await createBoard(userA, { title: 'Café' }).expect(201);

      expect(response.body.title).toBe('Café');
      expect(repository.rows[0].title).toBe('Café');
    });

    it('rejects a malformed board id with 400', async () => {
      await request(app.getHttpServer()).get('/api/boards/not-a-uuid').set(bearer(userA)).expect(400);

      expect(repository.findOne).not.toHaveBeenCalled();
    });

    it('resolves an upper-case UUID the same way as the lower-case one', async () => {
      const created = await createBoard(userA).expect(201);

      await request(app.getHttpServer())
        .get(`/api/boards/${(created.body.id as string).toUpperCase()}`)
        .set(bearer(userA))
        .expect(200);
    });
  });

  describe('access between two users', () => {
    it("does not include another user's boards in the list", async () => {
      const own = await createBoard(userA, { title: 'A board' }).expect(201);
      await createBoard(userB, { title: 'B board' }).expect(201);

      const listA = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);
      const listB = await request(app.getHttpServer()).get('/api/boards').set(bearer(userB)).expect(200);

      expect(listA.body.map((board: { id: string }) => board.id)).toEqual([own.body.id]);
      expect(listB.body).toHaveLength(1);
      expect(listB.body[0].title).toBe('B board');
    });

    it("answers 404 when reading another user's board", async () => {
      const own = await createBoard(userA, { title: 'Secret' }).expect(201);

      const response = await request(app.getHttpServer())
        .get(`/api/boards/${own.body.id}`)
        .set(bearer(userB))
        .expect(404);

      expect(JSON.stringify(response.body)).not.toContain('Secret');
    });

    it("gives the same response for another user's board as for an unknown id", async () => {
      const own = await createBoard(userA, { title: 'Secret' }).expect(201);

      const foreign = await request(app.getHttpServer()).get(`/api/boards/${own.body.id}`).set(bearer(userB));
      const unknown = await request(app.getHttpServer()).get(`/api/boards/${randomUUID()}`).set(bearer(userB));

      expect(foreign.status).toBe(404);
      expect(unknown.status).toBe(404);
      expect(foreign.body).toEqual(unknown.body);
    });

    it('does not leak the requested id in the 404 message', async () => {
      const id = randomUUID();

      const response = await request(app.getHttpServer()).get(`/api/boards/${id}`).set(bearer(userA)).expect(404);

      expect(JSON.stringify(response.body)).not.toContain(id);
    });

    it('still lets the owner read the board after the other user was refused', async () => {
      const own = await createBoard(userA, { title: 'Mine' }).expect(201);

      await request(app.getHttpServer()).get(`/api/boards/${own.body.id}`).set(bearer(userB)).expect(404);
      const response = await request(app.getHttpServer())
        .get(`/api/boards/${own.body.id}`)
        .set(bearer(userA))
        .expect(200);

      expect(response.body.title).toBe('Mine');
    });

    it('cannot create a board for another user by sending a userId', async () => {
      await createBoard(userB, { title: 'Hijack', userId: userA }).expect(400);

      const listA = await request(app.getHttpServer()).get('/api/boards').set(bearer(userA)).expect(200);
      expect(listA.body).toEqual([]);
    });

    it('lets two users create boards with the same title without interference', async () => {
      const a = await createBoard(userA, { title: 'Shared name' }).expect(201);
      const b = await createBoard(userB, { title: 'Shared name' }).expect(201);

      expect(a.body.id).not.toBe(b.body.id);
      expect(repository.rows.map((row) => row.userId).sort()).toEqual([userA, userB].sort());
    });

    it('treats a token for a user with no boards as an empty list, not an error', async () => {
      await createBoard(userA).expect(201);

      const response = await request(app.getHttpServer()).get('/api/boards').set(bearer(randomUUID())).expect(200);

      expect(response.body).toEqual([]);
    });
  });
});
