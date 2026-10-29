# Frontend

Мінімальний frontend на React, Vite і TypeScript із placeholder-екраном, який перевіряє доступність backend.

## Вимоги

- Node.js `24.22.1` та npm — ця версія узгоджена з backend і вказана в `package.json`.

## Встановлення та запуск

У директорії `frontend` встановіть залежності з lockfile:

```bash
npm ci
```

Запустіть dev-сервер:

```bash
npm run dev
```

Vite покаже адресу локального застосунку в терміналі. Для перевірки backend запустіть backend окремо на `http://localhost:3000`: запити з `/api` проксійовані туди через конфігурацію Vite.

## Перевірки

```bash
npm run build
npm run test
npm run lint
```

Build запускає перевірку TypeScript і створює production-збірку. Unit-тести виконуються через Vitest без React Testing Library; тести перевіряють health-сервіс і UI-компоненти. ESLint запускається командою `npm run lint`.

## Структура

```text
src/
├── components/
│   └── Placeholder.tsx        # показує стан підключення до backend
├── services/
│   ├── healthService.ts       # запит до GET /api/health
│   └── healthService.test.ts  # unit-тест health-сервісу
├── App.tsx                    # кореневий компонент
└── main.tsx                   # точка входу та React Query provider
```

## Storybook і теми

`npm run storybook` запускає локальний Storybook без автоматичного відкриття браузера. `npm run build-storybook` створює статичну збірку. [Контракт тем, токени, джерела та прогалини](docs/themes.md).

[UI-kit](docs/ui-kit.md) описує контракти компонентів, Tailwind/CVA та перевірки. Після `npm run test:ui:install` команда `npm run test:ui` збирає Storybook і запускає browser/axe suite. `npm run test:ui:visual` порівнює screenshots у зафіксованому Linux Docker image; `npm run test:ui:update` оновлює baselines для review. Обидві visual-команди потребують Docker.
