# Frontend

Frontend TaskPro на React, Vite і TypeScript. Стартова сторінка показує опис застосунку та переходи до реєстрації й входу.

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
│   └── ui/                    # спільні UI-компоненти
├── pages/
│   └── WelcomePage/           # стартова сторінка та Storybook story
├── services/
│   ├── healthService.ts       # запит до GET /api/health
│   └── healthService.test.ts  # unit-тест health-сервісу
├── App.tsx                    # кореневий компонент
└── main.tsx                   # точка входу та React Query provider
```

## Стартова сторінка

`App` показує `WelcomePage` без запитів до backend. Сторінка відтворює [desktop Start](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-3425), [tablet](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-6699) та [mobile](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-9325). Вихідні зображення й SVG збережені в `src/assets/welcome`; `manifest.json` містить node IDs та SHA-256. Від 768px використовується tablet/desktop композиція. На менших екранах контент має бічні відступи 20px; на низьких екранах сторінка прокручується.

Кольори welcome-сторінки фіксовані за макетом. `.welcome-page` перевизначає semantic tokens лише для своїх дочірніх компонентів і не змінює вибрану тему на `html`. Hover CTA та keyboard focus є адаптаціями до інтерактивної сторінки; Log In має область натискання 44px зі збереженою позицією тексту.

Посилання Registration і Log In ведуть на `/register` та `/login`. Форми й маршрутизатор додаються окремими auth-змінами. Під час їх інтеграції потрібно показувати `WelcomePage` для гостя на `/`, замінити перенаправлення гостя з `/` на `/login` і підключити окрему сторінку реєстрації до `/register`. До інтеграції ця гілка перевіряє адреси та native link navigation, але не реалізує auth-форми.

У Storybook сторінка доступна як `Pages/Welcome/Default`. Після `npm run build-storybook` команда `npx playwright test welcome.spec.ts` перевіряє геометрію трьох макетів, збереження кольорів у Dark/Light/Violet, axe, фокус і переходи з клавіатури.

## Storybook і теми

`npm run storybook` запускає локальний Storybook без автоматичного відкриття браузера. `npm run build-storybook` створює статичну збірку. [Контракт тем, токени, джерела та прогалини](docs/themes.md).

[UI-kit](docs/ui-kit.md) описує контракти компонентів, Tailwind/CVA та перевірки. Після `npm run test:ui:install` команда `npm run test:ui` збирає Storybook і запускає browser/axe suite. `npm run test:ui:visual` порівнює screenshots у зафіксованому Linux Docker image; `npm run test:ui:update` оновлює baselines для review. Обидві visual-команди потребують Docker.
