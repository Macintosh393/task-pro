# Backend

Backend API побудований на NestJS і запускається на Node.js 24 LTS (у `package.json` зафіксовано `24.22.1`).

## Структура

```text
backend/
├── src/
│   ├── main.ts              # точка входу: створює застосунок і встановлює префікс /api
│   ├── app.module.ts        # кореневий модуль, підключає конфігурацію та компоненти App
│   ├── app.controller.ts    # HTTP-маршрути, зокрема GET /health
│   └── app.service.ts       # сервісний шар для логіки застосунку
├── test/                    # інтеграційні тести
├── .env.example             # приклад змінних середовища
└── package.json             # залежності та команди проєкту
```

### Основні компоненти

- **AppModule** — кореневий модуль NestJS, який об'єднує контролери та провайдери застосунку.
- **ConfigModule** з `@nestjs/config` — підключений у `AppModule` як глобальний модуль; завантажує змінні з `.env`. Перевіряє обов'язкові змінні середовища під час запуску.
- **AppController** — приймає HTTP-запити та визначає маршрути.
- **AppService** — місце для бізнес-логіки, яку використовують контролери.

## Налаштування та запуск

Потрібен Node.js `24.22.1` та npm. У директорії `backend` виконайте:

```bash
npm ci
```

Створіть локальний `.env` на основі `.env.example`:

```bash
cp .env.example .env
```

Задайте підключення `POSTGRES_*`, `NODE_ENV`, `JWT_SECRET`, `ACCESS_TOKEN_TTL_MINUTES` і `REFRESH_TOKEN_TTL_DAYS`. Локальний frontend очікує backend на `PORT=3000`.

Якщо `PORT` не задано, застосунок використовує порт `3000`.

## Локальна база даних

Для локального PostgreSQL потрібні Docker Compose та файл `.env`. Створіть його на основі `.env.example`; значення в прикладі призначені лише для локальної розробки.

З директорії `backend` запустіть базу:

```bash
docker compose up -d
```

Перевірити стан:

```bash
docker compose ps
```

Зупинити базу, зберігши дані:

```bash
docker compose down
```

Дані зберігаються локально у директорії `backend/taskpro-pgdata`, змонтованій у контейнер як `/var/lib/postgresql`, і залишаються після зупинки та повторного запуску контейнера.

## Міграції бази даних

Перед роботою з міграціями запустіть PostgreSQL і перевірте налаштування підключення у `.env`. Файл `src/data-source.ts` завантажує ці змінні та використовує скомпільовані міграції з `dist/migrations/*.js`. Команди міграцій спочатку запускають build.

Згенерувати міграцію після змін у сутностях:

```bash
npm run migration:generate -- src/migrations/InitialSchema
```

Замініть `InitialSchema` на короткий опис змін. Створену міграцію перевірте та зафіксуйте у системі контролю версій.

Застосувати непройдені міграції:

```bash
npm run migration:run
```

Скасувати останню застосовану міграцію:

```bash
npm run migration:revert
```

Запуск у режимі розробки:

```bash
npm run start:dev
```

Після запуску `GET http://localhost:3000/api/health` повертає HTTP 204 без тіла.

Невідомі API-маршрути повертають HTTP 404.

## Автентифікація

`POST /api/auth/register` приймає `name`, `email` і `password`. Поле `name` зберігається як `username` у спільній сутності User. Реєстрація повертає HTTP 201 і одразу створює сесію. `POST /api/auth/login` приймає `email` і `password` та повертає HTTP 200. Обидва маршрути видають однакову відповідь користувача без password hash і HttpOnly cookies `accessToken` та `refreshToken`.

`GET /api/users/me` потребує access token. `POST /api/auth/refresh` оновлює cookies, а `POST /api/auth/logout` відкликає refresh token і очищає обидві cookies. У production cookies мають прапорець Secure.

Для локальної перевірки після міграцій запустіть `npm test` та `npm run test:e2e`. E2E-команда використовує підключення до PostgreSQL з `.env`.

## Команди

| Команда              | Призначення                                       |
| -------------------- | ------------------------------------------------- |
| `npm run start`      | Запустити застосунок                              |
| `npm run start:dev`  | Запустити застосунок із відстеженням змін         |
| `npm run build`      | Зібрати застосунок                                |
| `npm run start:prod` | Запустити зібраний застосунок                     |
| `npm run lint`       | Перевірити TypeScript-файли через ESLint без змін |
| `npm run lint:fix`   | Автоматично виправити lint-помилки ESLint         |
| `npm run format`     | Форматувати TypeScript-файли через Prettier       |
| `npm test`           | Запустити unit-тести                              |
| `npm run test:cov`   | Запустити тести та сформувати звіт покриття       |
