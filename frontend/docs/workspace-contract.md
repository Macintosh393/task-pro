# Контракт workspace

`WorkspaceView` збирає порожній захищений `/home` після входу. Header показує користувача, Sidebar містить Logo, заголовок My boards і порожній стан. Board містить заголовок Your workspace та порожній canvas.

## Файли та відповідальність

| Файл у `src/components/workspace/` | Відповідальність                                                       |
| ---------------------------------- | ---------------------------------------------------------------------- |
| `AppShell.tsx`                     | Header/sidebar/content, responsive layout, drawer, фокус і scroll lock |
| `WorkspaceView.tsx`                | Композиція поточного `/home`                                           |
| `workspace-types.ts`               | Типи користувача й props композиції                                    |
| `WorkspaceHeader.tsx`              | Кнопка меню та дані користувача                                        |
| `WorkspaceSidebar.tsx`             | Logo, My boards і порожній стан                                        |
| `WorkspaceBoard.tsx`               | Заголовок та canvas з обмеженою висотою                                |

Auth container у `src/routes/_authenticated/home.tsx` отримує поточного користувача через `useAuth` і передає його в `WorkspaceView`. Runtime fixture data, preview controls та auth bypass відсутні.

## `AppShell`

| Prop       | Тип                                  | Поведінка                                                                                                                                                               |
| ---------- | ------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `header`   | `({ menuButtonProps }) => ReactNode` | Рендер Header. `menuButtonProps` має тип `ComponentPropsWithRef<'button'>` і містить `ref`, `type`, `aria-label`, `aria-controls`, `aria-expanded`, `onClick`, `hidden` |
| `sidebar`  | `({ closeNavigation }) => ReactNode` | Рендер єдиного Sidebar у desktop `<aside>` або мобільному `<dialog>`. `closeNavigation(): void` закриває drawer                                                         |
| `children` | `ReactNode`                          | Контент у `<main>` з обмеженою шириною та висотою                                                                                                                       |

Header передає всі `menuButtonProps` спільному `Button`, який прокидає ref. AppShell володіє єдиним drawer state.

Стилізація компонентів використовує лише Tailwind utilities за [правилом репозиторію](../../AGENTS.md). Class markers на кшталт `.workspace-canvas` є селекторами для browser checks і не мають окремих CSS-визначень.

Native `dialog.showModal()` блокує фон. Tailwind utility `overflow-hidden!` на `html` блокує scroll; effect прибирає лише доданий ним клас і зберігає попередні класи та inline overflow. AppShell замикає Tab/Shift+Tab між доступними controls і закриває drawer через Escape, backdrop та кнопку закриття. Після закриття фокус повертається до меню. При переході відкритого drawer до desktop фокус отримує постійна навігація. Якщо сфокусований desktop Sidebar зникає при звуженні, фокус переходить до меню.

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

`WorkspaceUser` містить `username: string` і `email: string`. Єдиний prop `WorkspaceView` має назву `user` і тип `WorkspaceUser`. `WorkspaceHeader` отримує `user` та `menuButtonProps`. `WorkspaceSidebar` і `WorkspaceBoard` не мають props.

## Запуск і перевірки

Вхід або реєстрація відкриває `/home`. Потрібні запущені backend, PostgreSQL і чинна сесія. Команди та налаштування наведені в [Frontend README](../README.md#робота-над-workspace).

Browser checks використовують test-only API responses для поточного користувача й DOM content для overflow stress. Optional Empty story показує ту саму композицію з тестовим користувачем. Storybook не потрібен для запуску `/home`.

Компоненти споживають глобальні semantic tokens без окремого theme state.
