# Контракт workspace

`WorkspaceView` збирає компоненти захищеного `/home` після входу. Поточні Header, Sidebar і вміст дошки є початковими компонентами. Повні theme/profile controls, CRUD дошок, фільтри, колонки й картки належать окремим задачам.

## Файли та відповідальність

| Файли в `src/components/workspace/`       | Власник змін            | Відповідальність                                                       |
| ----------------------------------------- | ----------------------- | ---------------------------------------------------------------------- |
| `AppShell.tsx`                            | інтеграція              | Header/sidebar/content, responsive layout, drawer, фокус і scroll lock |
| `WorkspaceView.tsx`, `workspace-types.ts` | інтеграція              | Композиція та спільні props                                            |
| `WorkspaceHeader.tsx`                     | виконавець Header, #81  | Кнопка меню, дані користувача; наступні controls теми та профілю       |
| `WorkspaceSidebar.tsx`                    | виконавець Sidebar, #82 | Список дошок, події вибору та виходу                                   |
| `WorkspaceBoard.tsx`                      | виконавець Board, #25   | BoardHeader, bounded canvas і майбутня композиція колонок              |

Auth container залишається у `src/routes/_authenticated/home.tsx`. Він передає чинного користувача й існуючий onLogout callback. Продуктовий `/home` отримує порожній масив дошок, без тестових колонок або preview controls.

Зміни спільних props, breakpoints, маршрутів, глобального theme state та меж overflow потребують узгодження між власниками. Деталі Header, Sidebar й Board змінюються у власних TSX файлах із Tailwind utilities без редагування `WorkspaceView`.

## `AppShell`

| Prop       | Тип                                  | Поведінка                                                                                                                                                               |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`   | `({ menuButtonProps }) => ReactNode` | Рендер Header. `menuButtonProps` має тип `ComponentPropsWithRef<'button'>` і містить `ref`, `type`, `aria-label`, `aria-controls`, `aria-expanded`, `onClick`, `hidden` |
| `sidebar`  | `({ closeNavigation }) => ReactNode` | Рендер єдиного Sidebar. `closeNavigation(): void` закриває drawer після вибору                                                                                          |
| `children` | `ReactNode`                          | Контент у `<main>` з обмеженою шириною та висотою                                                                                                                       |

Header передає всі `menuButtonProps` справжньому `<button>` або спільному `Button`, який прокидає ref. Sidebar викликає `onSelectBoard(board.id)`, потім `closeNavigation()`. Компоненти не створюють власний drawer state. Поточний слот рендериться один раз, у desktop `<aside>` або мобільному `<dialog>`.

Стилізація компонентів використовує лише Tailwind utilities за [правилом репозиторію](../../AGENTS.md). Class markers на кшталт `.workspace-canvas` залишаються стабільними селекторами для browser checks і не мають окремих CSS-визначень.

Native `dialog.showModal()` блокує фон. Tailwind utility `overflow-hidden!` на `html` блокує scroll; effect прибирає лише доданий ним клас і зберігає попередні класи та inline overflow. AppShell замикає Tab/Shift+Tab між доступними controls, закриває drawer через Escape, backdrop, кнопку закриття та вибір дошки. Після закриття фокус повертається до меню. При переході відкритого drawer до desktop фокус отримує постійна навігація. Якщо сфокусований desktop Sidebar зникає при звуженні, фокус переходить до меню.

Свайп праворуч починається в окремій смузі 20px біля лівого краю під Header. Зміщення понад 60px при вертикальному відхиленні менш як 40px відкриває навігацію. Свайп ліворуч усередині drawer закриває його за тими самими порогами. Обробники не встановлені на Board canvas; його горизонтальні жести зберігаються.

## Розміри та overflow

| Viewport     | Навігація                                   | Header       | Бічний відступ контенту |
| ------------ | ------------------------------------------- | ------------ | ----------------------- |
| `<768px`     | Drawer, 225px, не ширше viewport мінус 44px | мінімум 60px | 20px                    |
| `768–1439px` | Drawer, 260px                               | мінімум 68px | 32px                    |
| `≥1440px`    | Постійний Sidebar, 260px                    | мінімум 68px | 24px                    |

Висота Shell дорівнює `100dvh`. Header може збільшитися під масштабованим текстом; main отримує решту висоти. `min-width: 0` і `min-height: 0` дозволяють контенту звужуватися. Sidebar має власний вертикальний scroll. `WorkspaceBoard` залишає заголовок нерухомим, а `.workspace-canvas` володіє горизонтальним scroll. Списки карток усередині майбутніх колонок мають власний вертикальний scroll і доступ з клавіатури.

Ширина desktop Sidebar, висоти Header та відступи взяті з [desktop](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-1862), [tablet](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-7795) і [mobile](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-9676). Breakpoint 1440px, ширини overlay й пороги свайпа є узгодженими рішеннями реалізації. Вказані frames показують закриту мобільну навігацію. Menu asset походить із mobile node `1058:9685`; Sidebar logo та project icon використовують чинний UI-kit. Кольори використовують semantic tokens із наявних тем.

## `WorkspaceView` та компоненти

`BoardSummary` містить `id: string` і `title: string`. `WorkspaceUser` містить `username: string` і `email: string`.

| Prop `WorkspaceView` | Тип                         | Поведінка                                            |
| -------------------- | --------------------------- | ---------------------------------------------------- |
| `user`               | `WorkspaceUser`             | Відображення користувача у Header                    |
| `onLogout`           | `() => void`                | Подія виходу для auth container                      |
| `boards`             | `readonly BoardSummary[]`   | Дошки Sidebar                                        |
| `activeBoardId`      | `string?`                   | Контрольований active item і заголовок               |
| `onSelectBoard`      | `(boardId: string) => void` | Подія вибору для зовнішнього власника даних/маршруту |
| `boardContent`       | `ReactNode?`                | Вміст canvas, за відсутності показує порожній стан   |

`WorkspaceHeader` отримує `user`, `menuButtonProps`. `WorkspaceSidebar` отримує `boards`, `activeBoardId`, `onSelectBoard`, `onLogout`, `closeNavigation`. Кнопку виходу в Sidebar реалізує #82. Основа передає `onLogout` для підключення, але не рендерить кнопку; auth/API та UI-kit LogoutButton залишаються доступними. `WorkspaceBoard` отримує `title: string` та `children?: ReactNode`; майбутні колонки підключаються всередині цього компонента.

За відсутнього або невідомого `activeBoardId` Sidebar не позначає активної дошки, заголовок має текст `Your workspace`. Поточний маршрут лише `/home`. `/home/$boardId` є пропозицією для наступної інтеграції списку й API, а не чинним маршрутом. Дані маршруту мають стати єдиним джерелом active item після погодження цього path.

## Робота в застосунку

Вхід або реєстрація відкриває `/home` із порожньою основою. Потрібні запущені backend, PostgreSQL і чинна сесія. Команди та налаштування наведені в [Frontend README](../README.md#робота-над-workspace). Runtime fixture data, preview controls або auth bypass відсутні.

Browser checks використовують test-only API responses для поточного користувача й DOM content для overflow stress. Optional AppShell story перевіряє справжні callbacks вибору дошки на story-only даних. Ці дані не підключені до застосунку й не вимагають Storybook для щоденної роботи над `/home`.

Продуктове перемикання теми належить #81, backend persistence #35. Поточна основа споживає глобальні semantic tokens без окремого theme state.
