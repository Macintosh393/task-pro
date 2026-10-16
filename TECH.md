# TaskPro — технічний план

Чернетка для командного review. Описує погоджений напрям, пропозиції та відкриті рішення, а не вже реалізовані можливості.

## Мета та межі

Простий завершений університетський проєкт: особисті kanban-дошки, колонки та картки. Передбачає реєстрацію, вхід, профіль, пріоритети, дедлайни, переміщення й фільтрацію карток, три теми, адаптивність і форму допомоги. Спільні дошки, ролі, запрошення та realtime-співпраця не входять у поточний обсяг.

## Погоджений стек

| Частина | Рішення |
| --- | --- |
| Frontend | React, Vite, TypeScript |
| Стан | Локальний React state; Context для спільного стану, без зовнішнього store |
| Стилі | Tailwind CSS та CSS custom properties для тем |
| UI-розробка | Storybook |
| Frontend-тести | Vitest, без React Testing Library |
| Backend | NestJS та TypeScript |
| Дані | PostgreSQL, TypeORM |
| Автентифікація | Власна email/password автентифікація |
| Інструменти | npm, ESLint, Prettier; спільна Node.js LTS, точну версію ще обираємо |
| Хостинг | AWS; Влад відповідає за DevOps, конкретні сервіси ще не обрані |

Це NestJS backend, не Next.js застосунок. Підхід до React DOM/component-тестів без RTL та backend test runner ще треба погодити; Vitest сам по собі не визначає спосіб взаємодії з React DOM.

## Репозиторій і конфігурація

```text
README.md
TECH.md
.gitignore
frontend/           # власні package.json і package-lock.json
  src/components/ui/  # примітиви з colocated stories/tests
backend/            # власні package.json і package-lock.json
```

Кожен пакет встановлюється, запускається, збирається та тестується окремо. Без Nx, Turborepo, pnpm workspaces або спільного workspace package manager. Поточний репозиторій публічний; секрети та приватні робочі матеріали сюди не додаємо.

Конфігурації створюємо з нуля, невеликими зрозумілими кроками. Автор пояснює призначення файлів, залежностей і scripts. CLI фреймворку може допомогти зі стартом, але його результат потрібно розібрати, спростити та пояснити; непрозорий boilerplate не замінює розуміння.

## Запуск та інтеграція

У development Vite й NestJS працюють окремо. Пропозиція: API під `/api`, Vite proxy та `/api/health` для першої перевірки зв'язку. UI kit і Storybook працюють без backend, БД та AWS credentials.

У production NestJS віддає зібраний frontend та API з одного origin. Refresh frontend-маршруту має повертати React entry point, а невідомий API-маршрут — API-помилку, не HTML. Реалізація production serving — наступна інтеграційна задача, не готова можливість.

## UI kit, типографіка та теми

Примітиви живуть у `frontend/src/components/ui`, приймають відповідні native HTML props, мають явні варіанти, доступні назви та видимий keyboard focus. Stories і тести — поруч із компонентами. API-виклики та бізнес-стан не належать примітивам.

Використовуємо Poppins. Точні ваги, розміри та interaction states перевіряємо за дизайном; не вважаємо неперевірені значення специфікацією.

Palette tokens описують кольори, semantic tokens — їхнє призначення, наприклад `--surface-card`, `--text-primary`, `--action-background`. Це запропоновані нами назви, а не підтверджена бібліотека semantic tokens у Figma. Однакові кольори з різним призначенням можуть мати різні semantic names.

Light, Dark і Violet задають значення однакових CSS variables через root `data-theme`. Компоненти зберігають markup і Tailwind-класи при зміні теми. App і Storybook використовують спільні fonts, tokens і base styles; toolbar Storybook перемикає теми. Збереження теми у профілі — пізніша задача.

Button задає приклад conventions; далі Input і Icon можна робити паралельно. Dialog потребує окремої уваги до focus, Escape та доступності й залишається наступним невеликим кроком після базових примітивів.

## Дані, API та автентифікація

Один NestJS застосунок і одна PostgreSQL БД. Пропоновані модулі: auth, users, boards, columns, cards. Зв'язки: користувач → дошки → колонки → картки. Кожна операція над особистими даними перевіряє власника; вхідні дані валідовані. Перед відповідною функцією погоджуємо ordering, видалення й каскади. Зміни схеми — через TypeORM migrations, без автоматичного production schema sync.

Реєстрація та вхід завжди окремі задачі. Паролі хешуються, секрети залишаються на сервері, production використовує HTTPS. Token lifetime, transport/storage, session restoration та logout/invalidation ще не вирішені. Якщо оберемо cookies, потрібно врахувати CSRF. Бізнес-автентифікацію не реалізуємо в перших setup-задачах.

## Якість і робота команди

Обидва full-stack учасники практикують frontend і backend паралельно приблизно перші два тижні; постійного поділу на frontend/backend ролі немає. Влад допомагає з архітектурою, review та AWS/DevOps.

Навчальні гілки можуть дублювати вправи і не мають автоматично потрапляти в main. Кожна спільна задача отримує одного merge owner після командного розподілу; невеликі PR проходять review іншого учасника. Автор пояснює конфігурацію й рішення. ADR фіксує значуще рішення, альтернативи та наслідки; для UI kit буде окремий ADR. Статус proposed/accepted не означає implemented.

Тести пропорційні поведінці: unit-тести логіки, перевірки API success/error та ownership, keyboard/interaction перевірки примітивів. Storybook не замінює автоматизовані тести. Ціль backend — щонайменше 70% coverage наприкінці проєкту, одна команда запуску тестів; метрики й інструменти уточнюємо до реалізації feature-тестів.

## Перші два тижні

19 жовтня — 1 листопада 2026 — запропоноване вікно планування, не жорсткий дедлайн. Після першого тижня переглядаємо обсяг за фактичною швидкістю. Початкові issues містять критерії приймання й залежності та залишаються unassigned для review.

- Дві індивідуальні full-stack вправи виконуються незалежно.
- Спільні frontend і backend foundations можна робити паралельно з навчанням, узгодивши власників.
- Storybook стартує після frontend base; дизайн tokens і типографіки можна досліджувати паралельно.
- Theme mapping, Button, Input та Icon спираються на мінімально погоджений token contract; не потрібно чекати всього застосунку.
- Development integration не блокує UI kit. БД, auth і production deployment не є передумовами UI-роботи.

## Docker та AWS

Спочатку запускаємо застосунки локально. На етапі БД додаємо мінімальний Compose для PostgreSQL із development volume та зрозумілими командами. Контейнеризація застосунків — пізніше, під час deployment. Конкретні AWS services, secrets management, HTTPS і deployment workflow ще треба спроєктувати; зараз вони не реалізовані.

## Відкриті рішення

- Точна спільна Node.js LTS та версії залежностей.
- React Router і Swagger/OpenAPI: у попередньому плані, деталізацію підтверджуємо при інтеграції.
- Component-test approach без RTL, backend test tooling та coverage metrics.
- Token storage/transport, строки життя й logout/invalidation.
- Значення Figma, відсутні interaction states, weights Poppins і остаточний token contract.
- AWS services, email provider; вимогу до Cloudinary для avatar уточнюємо перед інтеграцією.
- Правила дедлайнів/timezone, ordering і deletion для наступних feature-задач.

## Посилання

- [Figma UI kit](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-10396)
- [Storybook — Steve Kinney](https://stevekinney.com/courses/storybook)
- [TaskPro project board](https://github.com/users/Macintosh393/projects/1)
