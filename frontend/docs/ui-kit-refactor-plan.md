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

## Виправлення review

| Зауваження | Рішення та перевірка |
| --- | --- |
| `icon-data.tsx`: "fixed-colour Figma image assets"; `Icon.tsx`: "unchecked choices render in the selected colour" | Відновити inline geometry, `currentColor` для одноколірних glyphs і semantic tokens для logo/boxed-plus. Перевірити фактичний stroke у hover, disabled, destructive та checked states у трьох темах; синхронізувати docs із token contract. |
| `control-styles.ts`, Modal, AvatarUpload: "Focus-ring tokens orphaned" | Повернути читання width/offset tokens у трьох місцях. У browser tests змінити токени на 3px/5px і перевірити computed outline. |
| FormField, Modal: "text-sm sets line-height 20px" | Вказати `text-sm/normal`; перевірити 21px для label і modal description. |
| "Ten ui-* marker classes left with no CSS, test or script consumer" | Видалити десять невикористаних markers після census; залишити `ui-spinner` і `ui-modal`, які мають CSS consumers. |
| `.github/workflows/ui-kit.yml`: "matches no package.json script" | Додати `test:ui:ci` і викликати його з workflow. Запустити повний suite у pinned Linux image. |
| `ui-kit-browser.cjs`: "undeclared playwright package" | Імпортувати chromium із прямої залежності `@playwright/test` і прибрати повторний обхід stories. Перевірити contracts. Перенесення всього harness у native tests не входить у це виправлення; обмеження trace/config залишається. |
| `themes.md`: "describes the old Foundation/Theme tokens story" | Описати поточний swatch grid, Poppins і виключення non-color tokens; звірити з реалізацією story. |

Пріоритет має спільний semantic-token contract. Фіксовані кольори SVG не є навмисним винятком для інтерактивних іконок. Після функціональних перевірок переглянути visual diffs і оновити тільки baselines, змінені виправленнями. Повторити comparison, lint, unit tests і builds. Згадка review про відсутність PR застаріла: [PR #75](https://github.com/Macintosh393/task-pro/pull/75) уже відкритий.

Під час Linux run під x86 emulation harness із повторним обходом stories перевищив 170s, а об'єднаний axe-тест теми перевищив 180s. Повторний обхід прибрано; кожна story тепер має окремий Playwright test і timeout. Покриття 77 stories у трьох налаштуваннях теми збережено. Нові browser regressions перевіряють painted SVG stroke, semantic-token overrides, focus 3px/5px і line-height 21px. Переглянуто 15 змінених baselines із 33: reference, overview, error field, mobile і modal в кожній темі.

Завершено: lint, 13 unit tests, TypeScript, app/Storybook builds пройшли. Фінальний `npm run test:ui:ci` у pinned Linux image завершився з 247 passed без оновлення snapshots: 231 story/axe test, 3 open-modal audits, 9 regression tests, 3 visual tests із 33 comparisons та 1 contract suite. Повторний census підтвердив 0 references для десяти видалених marker classes. SHA-256 усіх 41 вихідних assets незмінні. Вісім технічних зауважень прийнято та виправлено; відхилених немає.
