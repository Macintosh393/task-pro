# Frontend

Frontend TaskPro на React, Vite і TypeScript. Гості починають зі стартової сторінки, а реєстрація та вхід відкривають захищену домашню сторінку.

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

Vite покаже адресу локального застосунку в терміналі. Для роботи застосунку налаштуйте `.env`, запустіть PostgreSQL і застосуйте міграції за [інструкцією backend](../backend/README.md#налаштування-та-запуск). Backend має працювати на `http://localhost:3000`, куди Vite проксіює запити з `/api`.

## Робота над workspace

Відкрийте застосунок, зареєструйтеся або увійдіть. Після входу `/home` показує спільну порожню основу з Header, Sidebar і областю дошки. Для цього потрібні backend, база даних і чинна сесія. Тестових дошок, колонок та окремого preview-маршруту в застосунку немає.

Змінюйте файл свого компонента за [контрактом workspace](docs/workspace-contract.md). Header, Sidebar і Board мають окремі TSX файли з Tailwind utilities. Кнопку виходу в Sidebar реалізує #82; чинні auth callback/API та UI-kit LogoutButton доступні для підключення. Storybook залишається додатковим ізольованим переглядом UI-kit і компонентних контрактів.

```bash
npm run lint
npm test -- --run
npm run test:workspace
```

`test:workspace` збирає production app, запускає dev/preview Vite на портах 5175/4175 та перевіряє захищений `/home`, drawer, клавіатуру, resize, overflow, теми й auth navigation. API responses та додатковий overflow content створюються тільки в browser tests. У продукті mocks немає. Перед першим browser-запуском виконайте `npm run test:ui:install`; порти 5175 і 4175 мають бути вільними.

## Перевірки

```bash
npm run build
npm run test
npm run lint
```

Build запускає перевірку TypeScript і створює production-збірку. Unit-тести виконуються через Vitest без React Testing Library та перевіряють auth API, форми, session cache, маршрути й UI-компоненти. Для одноразового запуску використайте `npm test -- --run`. ESLint запускається командою `npm run lint`.

## Структура

```text
src/
├── app/                       # providers, QueryClient і TanStack Router
├── components/ui/             # спільні UI-компоненти
├── features/auth/             # login, session state і current-user API
├── pages/
│   ├── RegisterPage.tsx       # окрема форма реєстрації
│   └── WelcomePage/           # стартова сторінка та Storybook story
├── routes/                    # login і захищена домашня сторінка
├── services/authService.ts    # реєстрація через спільний API client
├── App.tsx                    # експорт застосунку
└── main.tsx                   # точка входу
```

## Стартова сторінка

`App` перевіряє сесію через `/api/users/me`. На `/` гість бачить `WelcomePage`, а користувач із чинною сесією переходить на `/home`. Сторінка відтворює [desktop Start](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-3425), [tablet](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-6699) та [mobile](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-9325). Вихідні зображення й SVG збережені в `src/assets/welcome`; `manifest.json` містить node IDs та SHA-256. Від 768px використовується tablet/desktop композиція. На менших екранах контент має бічні відступи 20px; на низьких екранах сторінка прокручується.

Кольори welcome-сторінки фіксовані за макетом. `.welcome-page` перевизначає semantic tokens лише для своїх дочірніх компонентів і не змінює вибрану тему на `html`. Окремі RGB-градієнт та alpha mask зберігають інтерполяцію прозорого кольору Figma, зокрема проміжні відтінки фону. Texture підключено як CSS background від 768px, тому mobile не завантажує цей декоративний asset. Hover CTA та keyboard focus є адаптаціями до інтерактивної сторінки; Log In має область натискання 44px зі збереженою позицією тексту.

Посилання Registration і Log In відкривають окремі форми на `/register` та `/login`. Обидві форми після успіху оновлюють спільний session cache і відкривають `/home`. Reload відновлює користувача через API, а прострочений access token запускає refresh і повтор запиту. Callback успішного виходу повертає на `/`; його UI підключить Sidebar #82.

У Storybook сторінка доступна як `Pages/Welcome/Default`. Після `npm run build-storybook` команда `npx playwright test welcome.spec.ts` перевіряє геометрію трьох макетів, збереження кольорів у Dark/Light/Violet, axe, фокус і переходи з клавіатури.

## Storybook і теми

`npm run storybook` запускає локальний Storybook без автоматичного відкриття браузера. `npm run build-storybook` створює статичну збірку. [Контракт тем, токени, джерела та прогалини](docs/themes.md).

[UI-kit](docs/ui-kit.md) описує контракти компонентів, Tailwind/CVA та перевірки. Після `npm run test:ui:install` команда `npm run test:ui` збирає Storybook і запускає browser/axe suite. `npm run test:ui:visual` порівнює screenshots у зафіксованому Linux Docker image; `npm run test:ui:update` оновлює baselines для review. Обидві visual-команди потребують Docker.
