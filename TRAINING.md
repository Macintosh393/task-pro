# Навчання 2 - Full-stack setup

Issue: [#3](https://github.com/Macintosh393/task-pro/issues/3)  
Гілка: `ak-setup`

## Що зробила

Цього разу налаштувала frontend і backend окремо, щоб розібратися, як вони працюють разом.

Для frontend використала React, TypeScript і Vite, для backend - NestJS із TypeScript.

На backend додала простий endpoint `GET /api/health`, який повертає:

```json
{
  "status": "ok"
}
```

Потім налаштувала proxy у Vite, щоб React міг звертатися до backend. Зробила просту сторінку, на якій відображається статус сервера.

Також перевірила, що буде, якщо вимкнути backend. У такому випадку на сторінці з'являється `Backend unavailable`. Коли сервер працює, показує `Backend connected`.

## Як запустити

Спочатку запускаємо backend:

```bash
cd backend
npm install
npm run start:dev
```

Потім в іншому терміналі frontend:

```bash
cd frontend
npm install
npm run dev
```

Адреси для перевірки:

- Frontend: http://localhost:5173
- Backend: http://localhost:3000
- Health endpoint: http://localhost:3000/api/health

## Налаштування

У кожній папці є свій `package.json` із залежностями та командами для запуску, тестів і збірки.

Для TypeScript є окремі `tsconfig` файли. Вони визначають, як перевіряється та компілюється код. Frontend додатково використовує налаштування для React і браузера.

Vite запускає локальний сервер frontend. У `vite.config.ts` я додала proxy для `/api`, який перенаправляє запити на NestJS за адресою `localhost:3000`.

Сам NestJS запускається окремо, тому frontend і backend можна перевіряти незалежно один від одного.

## Як працює запит

Коли відкриваю сторінку, React робить `fetch('/api/health')`.

Vite передає запит на NestJS, той повертає JSON зі статусом, а React показує результат на сторінці.

Якщо backend вимкнений або запит не проходить, показується повідомлення про помилку.

## Тести та збірка

Для frontend додала два тести через Vitest. Вони перевіряють повідомлення для працюючого та недоступного backend.

Для backend залишила стандартний тест `Hello World!` і додала перевірку `getHealth()`.

Команди для перевірки:

**Frontend:**

```bash
cd frontend
npx vitest run
npm run build
```

**Backend:**

```bash
cd backend
npm run test
npm run build
```

У результаті пройшли всі 4 тести: 2 на frontend і 2 на backend. Обидві збірки також пройшли без помилок.

## Що зрозуміла

Раніше я працювала тільки з окремими React-проєктами, а тут вперше налаштувала frontend і backend разом.

Розібралася, для чого потрібен proxy, як React отримує дані через API та як перевіряти роботу сервера.
