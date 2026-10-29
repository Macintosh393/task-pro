# План рефакторингу UI-kit

Дата: 2026-10-29, Europe/Kyiv. Гілка: `refactor/figma-tailwind-cva-ui-kit`.

Джерела: [Figma UI KIT, 1058:10396](https://www.figma.com/design/t0eIVx06rFihnswWhS8Q2V/?node-id=1058-10396), [аудит курсу](storybook-course-audit.md), [TECH.md](../../TECH.md).

## Кроки та перевірки

1. Звірити live Figma context і screenshot зі складом компонентів, розмірами та локальними assets. Зберегти походження assets і задокументувати відхилення для доступності.
2. Додати Tailwind 4 `@theme inline` для семантичних токенів. Перенести стилі компонентів у utilities, variants і defaults у CVA з `VariantProps`. Перевірити TypeScript, поведінкові тести, геометрію та три теми.
3. Додати окремі stories та controls для Avatar, AvatarUpload, BoardIconPicker, Logo, LogoutButton і PriorityControl. Синхронізувати controls, додати assertions до interaction stories, MDX usage guide, каталог токенів, pinned theme/viewport приклади та Figma panel. Перевірити build Storybook і виконання stories.
4. Додати project-owned Playwright, axe-аудити, screenshot baselines та CI. Перевірити клавіатуру, modal focus, disabled/loading, введення, upload, native radio groups, вузький viewport і всі stories у трьох темах. Зафіксувати platform-specific baseline contract.
5. Оновити документацію реалізації й ADR без зміни його командного статусу. Запустити lint, unit tests, app build, Storybook build і browser/visual checks. Записати результати та невирішені обмеження.

## Межі

Зберігаємо native props, refs і наявні публічні контракти. Використовуємо наявні семантичні теми застосунку. Контраст тексту та keyboard focus мають пріоритет над низькоконтрастними source states; такі відхилення фіксуємо явно. MSW і loaders додаються лише за наявності data-dependent stories. Реєстрація зовнішніх Chromatic/Figma публікацій не потрібна для локальних visual regression checks.

## Стан

Реалізацію Tailwind/CVA, stories, MDX, addons, Playwright runner і CI завершено. Документацію та ADR оновлено, статус ADR залишено Draft. Усунуто дублікати plus/trash у Icon inventory та виправлено опис кольорів source SVG.

Перевірено lint, 13 unit tests, TypeScript, app build і Storybook build. Census дав 15 компонентів із власними stories, 18 story-файлів, 77 stories, 1 MDX і 33 Linux baselines; перевірено SHA-256 усіх 41 assets.

Перевірку завершено 2026-10-29 у середовищі з доступним loopback і Docker. `npm run test:ui` пройшов усі 7 тестів: 77 stories із кожним із трьох налаштувань теми, axe для stories і відкритих modal, keyboard/fields/upload/geometry contracts. `npm run test:ui:visual` пройшов 3 тести та порівняв усі 33 Linux screenshots із наявними baselines без їх оновлення. Переглянуто desktop і 320px reference screenshots у трьох темах, а також вибрані overview/modal baselines. Результати та межі записано в [ui-kit.md](ui-kit.md).

## Селектори browser tests

1. Замінити `.ui-button`, `.ui-avatar` і `.ui-avatar__placeholder` на locators за роллю та accessible name; `.ui-logo` знаходити за точним текстом. Зберегти перевірки розмірів wrapper, завантаження зображення та SVG fallback. Перевірити contracts у трьох темах.
2. Прибрати ці чотири class hooks із компонентів. Перевірити відсутність посилань на них у tests/scripts, lint, build Storybook та 33 Linux screenshot comparisons без оновлення baselines.

Виконано: кнопки та avatar знаходяться через `getByRole` з accessible name, logo через `getByText`. Розмір avatar wrapper перевіряється через батьківський елемент знайденого зображення; fallback assertion чекає SVG, щоб не прийняти пошкоджений `img` із тим самим ім'ям. Чотири class hooks видалено. Census 32 test/story/helper/script файлів дав 0 `ui-*` class selectors. Syntax checks scripts, lint, Storybook build, browser contracts у трьох темах і всі 33 Linux screenshot comparisons пройшли без оновлення baselines.
