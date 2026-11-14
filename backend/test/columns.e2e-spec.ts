import { randomUUID } from 'node:crypto';

import { ClassSerializerInterceptor, INestApplication } from '@nestjs/common';
import { APP_GUARD, Reflector } from '@nestjs/core';
import { JwtModule, JwtService } from '@nestjs/jwt';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import cookieParser from 'cookie-parser';
import request from 'supertest';
import { App } from 'supertest/types.js';
import { DataSource } from 'typeorm';

import { JwtAuthGuard } from '../src/auth/jwt-auth.guard.js';
import { BoardsService } from '../src/boards/boards.service.js';
import { Board } from '../src/boards/entities/board.entity.js';
import { ColumnsController } from '../src/columns/columns.controller.js';
import { ColumnsService } from '../src/columns/columns.service.js';
import { BoardColumn } from '../src/columns/entities/column.entity.js';
import { createGlobalPipes } from '../src/common/pipes/create-global-pipes.js';

const JWT_SECRET = 'test-secret';

type Where = Record<string, unknown>;
type Lock = { mode: string } | undefined;
type InsertValues = { boardId: string; title: string; position: unknown };

const sameValue = (a: unknown, b: unknown) => String(a).toLowerCase() === String(b).toLowerCase();
const matches = (row: object, where: Where) =>
  Object.entries(where).every(([key, value]) => sameValue((row as Record<string, unknown>)[key], value));

/** Lets other requests run, the way a database round trip would. */
const roundTrip = () => new Promise<void>((resolve) => setImmediate(resolve));

/**
 * In-memory stand-in for the DataSource / EntityManager / Repository<Board> calls that
 * ColumnsService and BoardsService make.
 *
 * - `where` is an AND of equality checks; uuid comparison is case-insensitive and stored
 *   uuids are lower-case, like Postgres. `where.board` filters by the owning board.
 * - `find` honours `order: { position }`; without it, rows come back in reverse insertion
 *   order, so only the requested ORDER BY can produce the stored order.
 * - A board lookup with `lock` inside `transaction()` holds a per-board lock until the
 *   transaction ends, and the INSERT reads max(position) one round trip before writing,
 *   so concurrent creates collide on UQ_columns_board_position unless they take the lock.
 */
function createFakeDataSource() {
  const boards: Board[] = [];
  const columns: BoardColumn[] = [];
  const clock = { now: new Date('2026-01-01T00:00:00.000Z') };
  const lockQueues = new Map<string, Promise<void>>();

  const acquireLock = async (key: string): Promise<() => void> => {
    const previous = lockQueues.get(key) ?? Promise.resolve();
    let release!: () => void;
    const held = new Promise<void>((resolve) => (release = resolve));
    lockQueues.set(
      key,
      previous.then(() => held),
    );
    await previous;

    return release;
  };

  const findBoard = vi.fn(async ({ where }: { where: Where }) => {
    await roundTrip();
    const found = boards.find((row) => matches(row, where));

    return found ? Object.assign(new Board(), found) : null;
  });

  const nextPosition = (boardId: unknown) => {
    const positions = columns.filter((row) => sameValue(row.boardId, boardId)).map((row) => row.position);

    return positions.length === 0 ? 0 : Math.max(...positions) + 1;
  };

  const insert = vi.fn(async (values: InsertValues) => {
    if (typeof values.position !== 'function') {
      throw new Error('position must be computed by the INSERT itself');
    }
    // Statement snapshot first, the write one round trip later: unlocked inserts interleave here.
    const position = nextPosition(values.boardId);
    await roundTrip();
    if (columns.some((row) => sameValue(row.boardId, values.boardId) && row.position === position)) {
      throw new Error('duplicate key value violates unique constraint "UQ_columns_board_position"');
    }
    const stored = Object.assign(new BoardColumn(), {
      id: randomUUID(),
      boardId: values.boardId.toLowerCase(),
      title: values.title,
      position,
      createdAt: new Date(clock.now),
      updatedAt: new Date(clock.now),
    });
    columns.push(stored);

    return { raw: [{ ...stored }] };
  });

  /** Covers the two builder chains ColumnsService.create() uses: the max subquery and the INSERT. */
  const createQueryBuilder = () => {
    let values: InsertValues | undefined;
    const builder = {
      select: () => builder,
      where: () => builder,
      getQuery: () => 'SELECT COALESCE(MAX(position) + 1, 0) ...',
      insert: () => builder,
      into: () => builder,
      values: (data: InsertValues) => {
        values = data;

        return builder;
      },
      setParameter: () => builder,
      returning: () => builder,
      execute: () => insert(values!),
    };

    return builder;
  };

  const boardsRepository = {
    findOne: ({ where, lock }: { where: Where; lock?: Lock }) => {
      if (lock) {
        throw new Error('a pessimistic lock requires a transaction');
      }

      return findBoard({ where });
    },
  };

  const manager = {
    find: vi.fn(async (_entity: unknown, { where, order }: { where: Where; order?: { position?: 'ASC' | 'DESC' } }) => {
      await roundTrip();
      const { board, ...own } = where as Where & { board?: Where };
      const result = columns
        .filter((row) => matches(row, own))
        .filter((row) => !board || boards.some((b) => sameValue(b.id, row.boardId) && matches(b, board)))
        .reverse();
      if (order?.position) {
        result.sort((a, b) => (order.position === 'DESC' ? b.position - a.position : a.position - b.position));
      }

      return result.map((row) => Object.assign(new BoardColumn(), row));
    }),
  };

  const transaction = vi.fn(async (isolation: string, run: (m: object) => Promise<unknown>) => {
    if (isolation !== 'READ COMMITTED') {
      throw new Error(`the fake only models READ COMMITTED, got ${isolation}`);
    }
    const releases: (() => void)[] = [];
    const transactionManager = {
      getRepository: (entity: unknown) => {
        if (entity !== Board) {
          throw new Error(`Unexpected entity ${String(entity)}`);
        }

        return {
          findOne: async ({ where, lock }: { where: Where; lock?: Lock }) => {
            const found = await findBoard({ where });
            if (found === null || !lock) {
              return found;
            }
            releases.push(await acquireLock(found.id));

            // Re-read once the lock is granted, like Postgres re-checks the row after waiting.
            return findBoard({ where });
          },
        };
      },
      createQueryBuilder,
      create: (_entity: unknown, data: Partial<BoardColumn>) => Object.assign(new BoardColumn(), data),
    };

    try {
      return await run(transactionManager);
    } finally {
      releases.forEach((release) => release());
    }
  });

  return {
    boards,
    columns,
    clock,
    manager,
    transaction,
    boardsRepository,
    findBoard,
    insert,
    seedBoard(userId: string, title = 'Board'): string {
      const id = randomUUID();
      boards.push(Object.assign(new Board(), { id, userId, title }));

      return id;
    },
  };
}

describe('ColumnsController (e2e)', () => {
  let app: INestApplication<App>;
  let db: ReturnType<typeof createFakeDataSource>;
  let jwtService: JwtService;

  const userA = randomUUID();
  const userB = randomUUID();
  const bearer = (sub: string) => ({ Authorization: `Bearer ${jwtService.sign({ sub })}` });
  const url = (boardId: string) => `/api/boards/${boardId}/columns`;

  const createColumn = (sub: string, boardId: string, body: unknown = { title: 'Column' }) =>
    request(app.getHttpServer())
      .post(url(boardId))
      .set(bearer(sub))
      .send(body as object);
  const listColumns = (sub: string, boardId: string) => request(app.getHttpServer()).get(url(boardId)).set(bearer(sub));
  const titles = (body: { title: string }[]) => body.map((column) => column.title);
  const positions = (body: { position: number }[]) => body.map((column) => column.position);
  const range = (count: number) => Array.from({ length: count }, (_, index) => index);

  beforeEach(async () => {
    db = createFakeDataSource();

    const module = await Test.createTestingModule({
      imports: [JwtModule.register({ secret: JWT_SECRET, signOptions: { expiresIn: '15m' } })],
      controllers: [ColumnsController],
      providers: [
        ColumnsService,
        BoardsService,
        { provide: DataSource, useValue: db },
        { provide: getRepositoryToken(Board), useValue: db.boardsRepository },
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
    const routes = [
      ['POST', (r: request.Agent, boardId: string) => r.post(url(boardId)).send({ title: 'Column' })],
      ['GET', (r: request.Agent, boardId: string) => r.get(url(boardId))],
    ] as const;

    it.each(routes)('%s rejects a request without credentials and touches nothing', async (_name, send) => {
      const boardId = db.seedBoard(userA);

      await send(request.agent(app.getHttpServer()), boardId).expect(401);

      expect(db.transaction).not.toHaveBeenCalled();
      expect(db.findBoard).not.toHaveBeenCalled();
      expect(db.manager.find).not.toHaveBeenCalled();
      expect(db.columns).toHaveLength(0);
    });

    it.each(routes)('%s rejects a garbage token', async (_name, send) => {
      const boardId = db.seedBoard(userA);

      await send(request.agent(app.getHttpServer()), boardId).set('Authorization', 'Bearer not-a-jwt').expect(401);
    });

    it.each(routes)('%s rejects an expired token', async (_name, send) => {
      const boardId = db.seedBoard(userA);
      const expired = jwtService.sign({ sub: userA }, { expiresIn: -10 });

      await send(request.agent(app.getHttpServer()), boardId).set('Authorization', `Bearer ${expired}`).expect(401);
    });

    it('rejects an unauthenticated request before validating the board id', async () => {
      await request(app.getHttpServer()).get(url('not-a-uuid')).expect(401);
    });

    it('accepts the access token from the accessToken cookie', async () => {
      const boardId = db.seedBoard(userA);

      await request(app.getHttpServer())
        .get(url(boardId))
        .set('Cookie', `accessToken=${jwtService.sign({ sub: userA })}`)
        .expect(200);
    });
  });

  describe('create → read', () => {
    it('creates a column and returns it', async () => {
      const boardId = db.seedBoard(userA);

      const response = await createColumn(userA, boardId, { title: 'To Do' }).expect(201);

      expect(response.body).toEqual({
        id: expect.stringMatching(/^[0-9a-f-]{36}$/),
        boardId,
        title: 'To Do',
        position: 0,
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
      });
      expect(response.body).not.toHaveProperty('board');
    });

    it('reads the created column back with identical data', async () => {
      const boardId = db.seedBoard(userA);
      const created = await createColumn(userA, boardId, { title: 'To Do' }).expect(201);

      const list = await listColumns(userA, boardId).expect(200);

      expect(list.body).toEqual([created.body]);
    });

    it('trims the title and stores it in Unicode NFC', async () => {
      const boardId = db.seedBoard(userA);

      // Decomposed input: "e" followed by U+0301 COMBINING ACUTE ACCENT.
      const response = await createColumn(userA, boardId, { title: '  Café  ' }).expect(201);

      expect(response.body.title).toBe('Café');
      expect(db.columns[0].title).toBe('Café');
    });

    it('allows duplicate titles on the same board', async () => {
      const boardId = db.seedBoard(userA);

      const first = await createColumn(userA, boardId, { title: 'Same' }).expect(201);
      const second = await createColumn(userA, boardId, { title: 'Same' }).expect(201);

      expect(first.body.id).not.toBe(second.body.id);
      expect([first.body.position, second.body.position]).toEqual([0, 1]);
    });

    it('creates the column inside a transaction', async () => {
      const boardId = db.seedBoard(userA);

      await createColumn(userA, boardId).expect(201);

      expect(db.transaction).toHaveBeenCalledOnce();
    });
  });

  describe('order', () => {
    it('returns an empty array for a board without columns', async () => {
      const boardId = db.seedBoard(userA);

      const response = await listColumns(userA, boardId).expect(200);

      expect(response.body).toEqual([]);
    });

    it('appends every new column to the end and reads them back in that order', async () => {
      const boardId = db.seedBoard(userA);
      for (const title of ['To Do', 'In Progress', 'Done']) {
        await createColumn(userA, boardId, { title }).expect(201);
      }

      const response = await listColumns(userA, boardId).expect(200);

      expect(titles(response.body)).toEqual(['To Do', 'In Progress', 'Done']);
      expect(positions(response.body)).toEqual([0, 1, 2]);
    });

    it('orders by position, not by creation time', async () => {
      const boardId = db.seedBoard(userA);
      // Clock goes backwards: createdAt order is the opposite of the append order.
      const base = new Date('2026-01-01T00:00:00.000Z').getTime();
      for (const [title, offsetMs] of [
        ['first', 2000],
        ['second', 1000],
        ['third', 0],
      ] as const) {
        db.clock.now = new Date(base + offsetMs);
        await createColumn(userA, boardId, { title }).expect(201);
      }

      const response = await listColumns(userA, boardId).expect(200);

      expect(titles(response.body)).toEqual(['first', 'second', 'third']);
    });

    it('appends after the highest position even when positions have gaps', async () => {
      const boardId = db.seedBoard(userA);
      // Simulates a board where a middle column was deleted (#42).
      db.columns.push(
        Object.assign(new BoardColumn(), { id: randomUUID(), boardId, title: 'a', position: 0, createdAt: new Date() }),
        Object.assign(new BoardColumn(), { id: randomUUID(), boardId, title: 'c', position: 2, createdAt: new Date() }),
      );

      const response = await createColumn(userA, boardId, { title: 'd' }).expect(201);
      const list = await listColumns(userA, boardId).expect(200);

      expect(response.body.position).toBe(3);
      expect(titles(list.body)).toEqual(['a', 'c', 'd']);
    });

    it('keeps the order of each board independent', async () => {
      const first = db.seedBoard(userA, 'First');
      const second = db.seedBoard(userA, 'Second');

      await createColumn(userA, first, { title: 'F1' }).expect(201);
      await createColumn(userA, first, { title: 'F2' }).expect(201);
      const s1 = await createColumn(userA, second, { title: 'S1' }).expect(201);
      await createColumn(userA, first, { title: 'F3' }).expect(201);

      const listFirst = await listColumns(userA, first).expect(200);
      const listSecond = await listColumns(userA, second).expect(200);

      expect(s1.body.position).toBe(0);
      expect(titles(listFirst.body)).toEqual(['F1', 'F2', 'F3']);
      expect(titles(listSecond.body)).toEqual(['S1']);
    });

    it('returns the same order on repeated reads', async () => {
      const boardId = db.seedBoard(userA);
      for (const title of ['a', 'b', 'c', 'd']) {
        await createColumn(userA, boardId, { title }).expect(201);
      }

      const first = await listColumns(userA, boardId).expect(200);
      const second = await listColumns(userA, boardId).expect(200);

      expect(second.body).toEqual(first.body);
    });
  });

  describe('concurrency', () => {
    it('gives parallel creates on one board distinct, consecutive positions', async () => {
      const boardId = db.seedBoard(userA);
      const count = 8;

      const responses = await Promise.all(
        range(count).map((index) => createColumn(userA, boardId, { title: `c${index}` })),
      );

      expect(responses.map((response) => response.status)).toEqual(range(count).map(() => 201));
      expect(
        responses.map((response) => (response.body as { position: number }).position).sort((a, b) => a - b),
      ).toEqual(range(count));
      expect(positions((await listColumns(userA, boardId).expect(200)).body)).toEqual(range(count));
    });

    it('numbers parallel creates on different boards independently', async () => {
      const first = db.seedBoard(userA);
      const second = db.seedBoard(userA);

      const responses = await Promise.all([
        createColumn(userA, first, { title: 'F1' }),
        createColumn(userA, second, { title: 'S1' }),
        createColumn(userA, first, { title: 'F2' }),
        createColumn(userA, second, { title: 'S2' }),
      ]);

      expect(responses.map((response) => response.status)).toEqual([201, 201, 201, 201]);
      expect(positions((await listColumns(userA, first).expect(200)).body)).toEqual([0, 1]);
      expect(positions((await listColumns(userA, second).expect(200)).body)).toEqual([0, 1]);
    });
  });

  describe('validation', () => {
    const invalidBodies: [string, unknown][] = [
      ['an empty body', {}],
      ['an empty title', { title: '' }],
      ['a whitespace-only title', { title: '   ' }],
      ['a 256-character title', { title: 'a'.repeat(256) }],
      ['a title with a null character', { title: 'To\u0000Do' }],
      ['a title of 200 emoji with variation selectors', { title: '❤️'.repeat(200) }],
      ['a numeric title', { title: 42 }],
      ['a null title', { title: null }],
      ['a boardId field', { title: 'Column', boardId: randomUUID() }],
      ['a position field', { title: 'Column', position: 0 }],
      ['an id field', { title: 'Column', id: randomUUID() }],
      ['a createdAt field', { title: 'Column', createdAt: '2020-01-01T00:00:00.000Z' }],
    ];

    it.each(invalidBodies)('rejects %s with 400 and stores nothing', async (_label, body) => {
      const boardId = db.seedBoard(userA);

      await createColumn(userA, boardId, body).expect(400);

      expect(db.insert).not.toHaveBeenCalled();
      expect(db.columns).toHaveLength(0);
    });

    it('rejects malformed JSON with 400', async () => {
      const boardId = db.seedBoard(userA);

      await request(app.getHttpServer())
        .post(url(boardId))
        .set(bearer(userA))
        .set('Content-Type', 'application/json')
        .send('{"title": ')
        .expect(400);

      expect(db.columns).toHaveLength(0);
    });

    it('accepts a title of exactly 255 characters', async () => {
      const boardId = db.seedBoard(userA);

      await createColumn(userA, boardId, { title: 'a'.repeat(255) }).expect(201);
    });

    it.each(['POST', 'GET'])('%s rejects a malformed board id with 400 without querying', async (method) => {
      const send = method === 'POST' ? createColumn(userA, 'not-a-uuid') : listColumns(userA, 'not-a-uuid');

      await send.expect(400);

      expect(db.findBoard).not.toHaveBeenCalled();
      expect(db.manager.find).not.toHaveBeenCalled();
    });

    it('resolves an upper-case board id the same way as the lower-case one', async () => {
      const boardId = db.seedBoard(userA);
      const created = await createColumn(userA, boardId.toUpperCase(), { title: 'To Do' }).expect(201);

      const response = await listColumns(userA, boardId.toUpperCase()).expect(200);

      expect(titles(response.body)).toEqual(['To Do']);
      // Both responses carry the canonical lower-case id, so clients can compare it with board.id.
      expect(created.body.boardId).toBe(boardId);
      expect(response.body[0].boardId).toBe(boardId);
    });
  });

  describe('access between two users', () => {
    it("answers 404 when creating a column on another user's board and stores nothing", async () => {
      const boardOfA = db.seedBoard(userA, 'Secret');

      const response = await createColumn(userB, boardOfA, { title: 'Intrusion' }).expect(404);

      expect(response.body.message).toBe('Board not found');
      expect(JSON.stringify(response.body)).not.toContain('Secret');
      expect(db.columns).toHaveLength(0);
    });

    it("answers 404 when reading columns of another user's board, without leaking them", async () => {
      const boardOfA = db.seedBoard(userA);
      await createColumn(userA, boardOfA, { title: 'Private column' }).expect(201);

      const response = await listColumns(userB, boardOfA).expect(404);

      expect(JSON.stringify(response.body)).not.toContain('Private column');
    });

    it("gives the same response for another user's board as for an unknown board", async () => {
      const boardOfA = db.seedBoard(userA);
      const unknown = randomUUID();

      for (const send of [createColumn, listColumns] as const) {
        const foreign = await send(userB, boardOfA);
        const missing = await send(userB, unknown);

        expect(foreign.status).toBe(404);
        expect(missing.status).toBe(404);
        expect(foreign.body).toEqual(missing.body);
        expect(JSON.stringify(missing.body)).not.toContain(unknown);
      }
    });

    it('still lets the owner create and read after the other user was refused', async () => {
      const boardOfA = db.seedBoard(userA);

      await createColumn(userB, boardOfA, { title: 'Intrusion' }).expect(404);
      await createColumn(userA, boardOfA, { title: 'Mine' }).expect(201);
      await listColumns(userB, boardOfA).expect(404);

      const response = await listColumns(userA, boardOfA).expect(200);

      expect(titles(response.body)).toEqual(['Mine']);
      expect(response.body[0].position).toBe(0);
    });

    it('keeps the columns of two users on their own boards apart', async () => {
      const boardOfA = db.seedBoard(userA);
      const boardOfB = db.seedBoard(userB);

      await createColumn(userA, boardOfA, { title: 'A1' }).expect(201);
      await createColumn(userB, boardOfB, { title: 'B1' }).expect(201);
      await createColumn(userA, boardOfA, { title: 'A2' }).expect(201);

      expect(titles((await listColumns(userA, boardOfA).expect(200)).body)).toEqual(['A1', 'A2']);
      expect(titles((await listColumns(userB, boardOfB).expect(200)).body)).toEqual(['B1']);
    });
  });
});
