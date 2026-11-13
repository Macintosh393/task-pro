# Контракт workspace

`WorkspaceView` збирає захищений `/home` після входу. Header показує користувача. Sidebar містить Logo, My boards, Create a new board, список дошок, Help card і Log out. Board містить заголовок Your workspace та порожній canvas. У застосунку список дошок порожній: дані й маршрут дошки з'являться у #36.

## Файли та відповідальність

| Файл у `src/components/workspace/` | Відповідальність                                                       |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `AppShell.tsx`                     | Header/sidebar/content, responsive layout, drawer, фокус і scroll lock |
| `WorkspaceView.tsx`                | Композиція `/home`, props Sidebar, закриття drawer після вибору дошки  |
| `workspace-types.ts`               | Типи користувача, дошки та props композиції                            |
| `WorkspaceHeader.tsx`              | Кнопка меню та дані користувача                                        |
| `sidebar/WorkspaceSidebar.tsx`     | Композиція Sidebar: Logo, My boards, Create, список, Help, Log out     |
| `sidebar/WorkspaceBoardList.tsx`   | Стани loading / empty / error / ready та scroll-область списку         |
| `sidebar/WorkspaceBoardItem.tsx`   | Рядок дошки: вибір, активний стан, Edit і Delete                       |
| `sidebar/WorkspaceCreateBoard.tsx` | Рядок Create a new board                                               |
| `sidebar/WorkspaceHelpCard.tsx`    | Рослина, текст і кнопка Need help?                                     |
| `WorkspaceBoard.tsx`               | Заголовок та canvas з обмеженою висотою                                |

Auth container у `src/routes/_authenticated/home.tsx` отримує поточного користувача й `logout` через `useAuth` і передає їх у `WorkspaceView`. Після успішного `logout` (він очищає auth-кеш і `queryClient`) container переходить на `/` з `replace: true`; помилка скидає pending і лишає користувача на `/home`. Runtime fixture data, preview controls та auth bypass відсутні.

## `AppShell`

| Prop       | Тип                                  | Поведінка                                                                                                                                                               |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`   | `({ menuButtonProps }) => ReactNode` | Рендер Header. `menuButtonProps` має тип `ComponentPropsWithRef<'button'>` і містить `ref`, `type`, `aria-label`, `aria-controls`, `aria-expanded`, `onClick`, `hidden` |
| `sidebar`  | `({ closeNavigation }) => ReactNode` | Рендер єдиного Sidebar у desktop `<aside>` або мобільному `<dialog>`. `closeNavigation(): void` закриває drawer                                                         |
| `children` | `ReactNode`                          | Контент у `<main>` з обмеженою шириною та висотою                                                                                                                       |

Header передає всі `menuButtonProps` спільному `Button`, який прокидає ref. AppShell володіє єдиним drawer state.

Стилізація компонентів використовує лише Tailwind utilities за [правилом репозиторію](../../AGENTS.md). Class markers на кшталт `.workspace-canvas` є селекторами для browser checks і не мають окремих CSS-визначень.

Native `dialog.showModal()` блокує фон. Tailwind utility `overflow-hidden!` на `html` блокує scroll; effect прибирає лише доданий ним клас і зберігає попередні класи та inline overflow. AppShell замикає Tab/Shift+Tab між доступними controls і закриває drawer через Escape, backdrop, свайп ліворуч і вибір дошки. Кнопки закриття в drawer немає. Після закриття фокус повертається до меню. При переході відкритого drawer до desktop фокус отримує постійна навігація. Якщо сфокусований desktop Sidebar зникає при звуженні, фокус переходить до меню.

Свайп праворуч починається в окремій смузі 20px біля лівого краю під Header. Зміщення понад 60px при вертикальному відхиленні менш як 40px відкриває навігацію. Свайп ліворуч усередині drawer закриває його за тими самими порогами. Обробники не встановлені на Board canvas; його горизонтальні жести зберігаються.

## Розміри та overflow

| Viewport     | Навігація                                   | Header       | Бічний відступ контенту |
| ------------ | ------------------------------------------- | ------------ | ----------------------- |
| `<768px`     | Drawer, 225px, не ширше viewport мінус 44px | мінімум 60px | 20px                    |
| `768–1439px` | Drawer, 260px                               | мінімум 68px | 32px                    |
| `≥1440px`    | Постійний Sidebar, 260px                    | мінімум 68px | 24px                    |

Висота Shell дорівнює `100dvh`. Header може збільшитися під масштабованим текстом; main отримує решту висоти. `min-width: 0` і `min-height: 0` дозволяють контенту звужуватися. Sidebar має власний вертикальний scroll. `WorkspaceBoard` залишає заголовок нерухомим, а `.workspace-canvas` володіє горизонтальним scroll.

Ширина desktop Sidebar, висоти Header та відступи взяті з [desktop](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-1862), [tablet](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-7795) і [mobile](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-9676). Breakpoint 1440px, ширини overlay й пороги свайпа є узгодженими рішеннями реалізації. Вказані frames показують закриту мобільну навігацію. Menu asset походить із mobile node `1058:9685`; Sidebar logo використовує чинний UI-kit. Кольори використовують semantic tokens із наявних тем.

## `WorkspaceView` та компоненти

AppHeader показує Theme та кнопку профілю з `username` і `avatarUrl` (опційний/null → placeholder). Email не відображається в шапці. `onEditProfile` — точка підключення #32–34; редактор профілю тут не реалізований.

`WorkspaceUser` містить `username: string`, `email: string` та `avatarUrl?: string | null`; `WorkspaceBoard` — `id`, `title` і `icon: BoardIcon`. `WorkspaceView` приймає `user` та необов'язкові `boards` (за замовчуванням `[]`), `boardsStatus` (`'loading' | 'ready' | 'error'`, за замовчуванням `'ready'`), `activeBoardId`, `onCreateBoard`, `onSelectBoard`, `onEditBoard`, `onDeleteBoard`, `onRetryBoards`, `onOpenHelp`, `onLogout`, `logoutPending`, `onEditProfile` та `onOpenFilters`. Відсутні callbacks Sidebar замінюються модульним no-op. `WorkspaceHeader` отримує `user`, `menuButtonProps` і опційний `onEditProfile`.

`activeBoardId` є єдиним джерелом вибору. `WorkspaceView` знаходить відповідну дошку в `boards` і передає її як `activeBoard` у `WorkspaceBoard` разом із `onOpenFilters`; локальної копії вибраної дошки немає. До #36 `/home` залишається порожнім із заголовком Your workspace. `onOpenFilters` — точка підключення #49; Filters disabled без дошки або обробника. Runtime fixtures відсутні. Довгі ім'я та назва обрізаються без перекриття дій; повний текст доступний у title та accessible name.

## Sidebar

`WorkspaceSidebar` презентаційний: без `useState`, даних і знання про drawer. Єдиний active-board стан — prop `activeBoardId`. Єдиний власник drawer — `AppShell`.

Порядок зверху вниз: Logo → `My boards` → рядок Create a new board → список дошок → Help card → Log out. Create розташований **над** списком. Реагує лише кнопка-плюс (`IconButton treatment="compact-add"`); текст не інтерактивний.

| Область | Правило |
| --- | --- |
| Root | `flex h-full min-h-0 flex-1 flex-col overflow-y-auto`, відступ 20px (<768px) / 24px (≥768px). Прокручується лише якщо Logo, footer і мінімум списку (96px) не вміщуються у viewport |
| Список | `.workspace-board-list`: `min-h-24 flex-1 overflow-y-auto`; єдиний внутрішній scroll. Рядки на всю ширину Sidebar без проміжків між ними (негативний margin списку компенсує відступ root); scrollbar списку тонкий (`scrollbar-width: thin`, колір `--text-sidebar-label`) |
| Footer | `.workspace-sidebar__footer`: Help card і Log out поза scroll-областю, тому довгий список їх не перекриває |

Стани списку: `loading` — `role="status"` і три placeholder; `error` — `role="alert"` і кнопка Try again (`onRetryBoards`); `ready` без дошок — «Your boards will appear here.»; `ready` — `ul` з рядками.

Активна дошка визначається лише prop `activeBoardId`; `WorkspaceView` і `/home` не зберігають вибір (це робить #36). У stories вибір інтерактивний через локальний state обгортки.

Рядок дошки: native `<button>` (іконка 18px, назва з `truncate` і `title`) та окремі sibling-кнопки Edit і Delete (`IconButton`, glyph 16px, ціль 24×24, `aria-label` містить назву дошки). Активний рядок має `aria-current="true"`, поверхню `surface-sidebar-selected` і індикатор 4px біля правого краю Sidebar; його дії завжди видимі. Неактивний рядок приглушений; при hover/focus-within отримує `surface-sidebar-hover` і повний колір тексту. Дії неактивного рядка прибрані з layout (`hidden`, тож не займають місце під назву) лише на пристроях із `hover: hover` і з'являються при hover/focus-within; на touch вони завжди видимі. Edit і Delete викликають лише свої callbacks, вибір дошки не запускають. Вибір дошки викликає `onSelectBoard(board)`, а потім `closeNavigation()` (на desktop no-op).

Help card: рослина (`img2.png`, декоративна), текст (12px на <768px, 14px від 768px) «If you need help with TaskPro, check out our support resources or reach out to our customer support team.» з акцентом на `TaskPro` та текстова кнопка `Need help?` (`Button variant="ghost"` з іконкою `help`) → `onOpenHelp`. Форма й обробка звернення — #50.

Log out — наявний `LogoutButton`; `logoutPending` вимикає його й показує loading.

Кольорові ролі Sidebar описані в [themes.md](themes.md#ролі-sidebar). Кольори `ghost`-кнопок Edit, Delete і Need help? перевизначені на місці використання (як у `LogoutButton` та menu-кнопці Header): kit-кольори `ghost` нечитабельні на Violet Sidebar.

## Запуск і перевірки

Вхід або реєстрація відкриває `/home`. Потрібні запущені backend, PostgreSQL і чинна сесія. Команди та налаштування наведені в [Frontend README](../README.md#робота-над-workspace).

Browser checks використовують test-only API responses для поточного користувача й DOM content для overflow stress. Stories `Workspace/Sidebar` (Empty, Loading, Error, Filled, Active, LongNames) і `Workspace/AppShell` (Empty, Filled) містять демонстраційні дошки лише у файлах stories; `tests/browser/workspace-sidebar.spec.ts` перевіряє кольори станів у трьох темах. Storybook не потрібен для запуску `/home`.

Компоненти споживають глобальні semantic tokens без окремого theme state.
