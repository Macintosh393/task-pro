# Спільний UI-kit — локальна пропозиція

Реалізація для review у `refactor/figma-tailwind-cva-ui-kit`. ADR залишається Draft. Немає API, auth/business forms, карток/колонок, datepicker чи Stack/Grid. Імпорти: `src/components/ui`. Застосунок і Storybook завантажують один `src/index.css`; компонентні стилі не живуть у stories.

## Контракти

| Компонент        | API / поведінка                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text             | `as="p"/"span"`, `size="small"/"medium"`, `tone="primary"/"muted"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Heading          | `level={1..6}` незалежно від `size="small"/"medium"/"large"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Button           | Native button props/ref, `type="button"` за замовчуванням, явний `type="submit"` для форми. `variant="primary"/"secondary"/"destructive"/"ghost"`, `size="small"/"medium"`, `disabled`, `loading`. Loading зберігає label/розмір, додає progress mark та `aria-busy`, вимикає повторну активацію. Consumer відповідає за початок/завершення async стану.                                                                                                                                                                                                         |
| IconButton       | Ті самі variants/states, обов’язкові `icon` і `aria-label`. Мінімальна hit area 44×44.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Icon             | TaskPro action/board icons, `size={10/16/18/20/24/28/32/68}`; `currentColor` для одноколірних glyphs, semantic tokens для logo/boxed-plus. Без `label` декоративний; із `label` — `role="img"`. У вже названій кнопці не додавайте label іконці.                                                                                                                                                                                                                                                                                                                                                                              |
| FormField        | Один Input або Textarea, `label`, опційні `help`, `error`, `id`. Generated `useId` зв’язує label/help/error. Явний id передавайте FormField; child id усередині нього ігнорується.                                                                                                                                                                                                                                                                                                                                                                               |
| Input / Textarea | Native props/ref, controlled або uncontrolled. Context додає id, invalid, об’єднує help/error з зовнішнім `aria-describedby`. Поза FormField consumer сам додає label або aria-label. Немає бізнес-валідації.                                                                                                                                                                                                                                                                                                                                                    |
| Modal            | Controlled `open`, `onClose`, обов’язковий `title`, опційні `description`, `initialFocusRef`, `closeLabel`. Native `showModal()` забезпечує top layer та inert background; Tab/Shift+Tab edge wrapping утримує keyboard focus у shell. Початковий focus на heading або вказаний елемент усередині. Escape і close викликають onClose; parent має встановити open=false. Cleanup повертає focus, якщо trigger існує. Backdrop не закриває. Не використовуйте `form method="dialog"` і не викликайте dialog.close() самостійно: закривайте через controlled state. |

Приклад композиції:

```tsx
<FormField label="Title" help="Short name" error={error}>
  <Input value={title} onChange={event => setTitle(event.target.value)} />
</FormField>
<Button type="submit" loading={saving}>Save changes</Button>
```

Backdrop не закриває Modal, щоб shell не нав’язував політику втрати даних. Async/pending cancellation та бізнес-правила належать consumer. Поточний shell не є confirmation service або nested-modal manager. Потрібен браузер із native dialog/showModal; polyfill не додавався.

## Узгодження з backlog

- [#10 — reference Button](https://github.com/Macintosh393/task-pro/issues/10): native props/type/name, focus, disabled/loading, semantic tokens, colocated stories і Vitest DOM checks.
- [#11 — Input та стани форми](https://github.com/Macintosh393/task-pro/issues/11): один Input primitive з композицією FormField для label/hint/error; help є API-назвою hint. Textarea повторно використовує той самий контракт, не дублює бізнес-форму.
- [#12 — мінімальний Icon](https://github.com/Macintosh393/task-pro/issues/12): три sourced assets, sizing/currentColor, named/decorative cases. IconButton — окремий компонент у ширшому дозволеному UI-kit scope, не розширення issue #12 на весь asset pipeline.

Нових компонентів, які суперечать існуючим, не знайдено: до цього був лише Placeholder. Team review test conventions і Draft ADR залишається потрібним; локальна реалізація не закриває issues та не означає командного прийняття.

## Джерела та адаптації

41 оригінальний asset у `src/assets/figma` збережено для provenance; SHA-256 і вихідний UI KIT записані в [маніфесті Figma](figma-assets.json). Raster plant використовується в reference story. Іконки рендерять inline SVG geometry з [ui-kit-assets.json](ui-kit-assets.json): одноколірні glyphs успадковують `currentColor`, logo і boxed-plus читають semantic tokens. Теми та hover/disabled/checked states керують кольором через CSS. Перемикання SVG images за назвами тем прибрано, оскільки воно ламало успадкування кольору. Нижче описано походження geometry та адаптацій.

Original pack `/home/vlad/Documents/Codex/taskpro-next-spec`: FREEZE SHA-256 `8a34d3559079e645f69270d69c757b4885685f10a18e7273a79441588c2654ac`, перевірено 1025/1025 hashes без розбіжностей. Використано DESIGN.md, UI-kit context/screenshot `1058:10396`, close SVG `1058:4908`, наявний [theme contract](themes.md). Figma MCP, experimental implementation code та generated JSX не використовувалися як реалізація.

- Source: Poppins 400/500/600; незмінені локальні TTF, upstream manifest і OFL у `src/assets/fonts`. Body 14px, small 12/16, dialog heading 18px/500/-0.36px; action/field 14px/-0.28px, 49px висота, 8px radius. Heading 16/24px, line heights, spacing shell і розміри варіантів — адаптації, не точні source компоненти.
- Source: існуючі surface/text/action colors через semantic tokens; оригінальні SVG path/viewBox із provenance у [ui-kit-assets.json](ui-kit-assets.json). Inline SVG зберігає geometry, використовує currentColor або semantic roles для багатоколірних logo/boxed-plus, видаляє export IDs, source opacity та зайві viewport clip paths. Немає вигаданого asset library.
- Derived: control border #929292 dark / #767676 light, readable muted text #b8b8b8 / #626262; не переносимо 40% opacity source field на весь control. Error/destructive #ff9b9b dark / #b42318 light, foreground і hover, disabled background/text, backdrop, spinner, focus та active inset — UI-kit adaptations.
- Source green hover **#9dc888** із retained screenshot замінює попереднє наближення #c8e6ba. Violet hover **#4649a6**, а не раніше запропонований #7b7ede: останній недостатньо контрастний із білим 14px label. #7b7ede залишається documented source palette value, але не використовується як hover цієї кнопки. Це навмисне відхилення для читабельності, не уточнена Figma variable.
- Modal width 480px, padding 24px, theme filters surface, scrolling із 16px clearance, icon hit targets ≥44px — адаптації для reusable shell, не screenshot fidelity claim.

## Storybook і тести

Підходи Steve Kinney використані концептуально та адаптовані до встановленого Storybook 10.6.3:
[controls](https://stevekinney.com/courses/storybook/controls),
[argTypes metadata](https://stevekinney.com/courses/storybook/arg-types),
[play functions](https://stevekinney.com/courses/storybook/play-functions),
[component tests](https://stevekinney.com/courses/storybook/testing-components-with-storybook),
[themes](https://stevekinney.com/courses/storybook/adding-dark-mode-to-our-components),
[hierarchy](https://stevekinney.com/courses/storybook/naming-and-hierarchy).

Colocated CSF stories мають shared args, meaningful variants/states, controls, API descriptions та autodocs; `UI/Overview` і TypeSet допомагають порівнювати ті самі primitives. Theme toolbar керує html data-theme. Play checks для click/loading використовують native DOM та bundled `storybook/test`; browser QA перевіряє реальну клавіатуру окремо. Не копіюємо палітру курсу чи старі package/API recipes.

Vitest із jsdom та `react-dom/client` / React `act` перевіряє поведінку компонентів без React Testing Library. Native focus, layout і keyboard actions перевіряє project-owned Playwright. `@storybook/addon-a11y` показує axe-результати у Storybook; browser suite виконує axe для кожної story. Designs addon відкриває посилання на UI KIT, доступ до якого залежить від Figma permissions.

Tailwind 4 використовує semantic tokens через `src/styles/tailwind-theme.css` і `@theme inline`. CVA зберігає variants/defaults, `VariantProps` виводить типи, а `cn` із `tailwind-merge` об'єднує utility classes. Стилі полів і focus ring спільні через `control-styles.ts`.

З `frontend`, Node 24.22.1:

```sh
nvm use
npm ci
npm run dev
npm run storybook
npm run lint
npm test -- --run
npm run build
npm run build-storybook
npm run test:ui:install
npm run test:ui
npm run test:ui:visual
```

Storybook відкривається на http://127.0.0.1:6006. Playwright сам запускає static server на порту 6008. `test:ui` збирає Storybook і виконує поведінкові та axe-перевірки. `test:ui:check` повторює ці перевірки на вже зібраному Storybook. `test:ui:ci` запускає весь Playwright suite, включно з visual tests, у pinned Linux environment після build. Каталог містить 77 stories, 18 story-файлів та одну MDX-сторінку; кожен із 15 UI-компонентів має власні stories. Theme toolbar перемикає Dark/Light/Violet; pinned examples зберігають свою тему.

### Контракт visual baselines

`npm run test:ui:visual` збирає Storybook і порівнює 33 screenshots у Docker. Runner фіксує `linux/amd64` і Playwright 1.64.1 Noble за digest; CI використовує той самий образ. Залежності беруться з локального `node_modules`, тому спочатку потрібен `npm ci`. Docker має бути запущений.

`npm run test:ui:update` оновлює baselines у тому самому контейнері. Перегляньте PNG і diff перед commit. Baselines у `tests/browser/stories.spec.ts-snapshots/*-linux.png` не слід замінювати macOS screenshots. Перевірки фіксують viewport 900×900, device scale 1, reduced motion, locale en-US і timezone Europe/Kyiv; mobile має 320×600. Допуск порівняння становить 0.1% пікселів.

CI у `.github/workflows/ui-kit.yml` запускає lint, unit tests, app/Storybook builds і повний Playwright suite. Reports і traces зберігаються як artifacts. Локальні результати знаходяться в `playwright-report/<platform>` і `test-results/<platform>`; contract captures та JSON звіт у підкаталозі `contracts`.

## Перевірки рефакторингу, 2026-10-29

- Node 24.22.1: lint, 13 тестів у 7 файлах, TypeScript, app build і Storybook build пройшли.
- Перераховано 15 компонентів, 18 story-файлів, 77 stories та 33 Linux baselines. Усі 41 локальний asset відповідають SHA-256 у маніфесті.
- `npm run test:ui` завершився успішно після запуску в середовищі з доступним loopback: 7 tests passed. Усі 77 stories пройшли render/play та axe з налаштуваннями Dark, Light і Violet; pinned examples зберігають власну тему. Відкриті modal пройшли окремі axe-перевірки в трьох темах. Runtime page errors не зафіксовано.
- Keyboard, modal focus/return, disabled/loading, controlled fields, upload/fallback, native radio groups, source geometry/colors і 320px overflow checks пройшли в трьох темах. Звіт: `test-results/darwin/contracts/results.json`; Playwright report: `playwright-report/darwin/index.html`.
- `npm run test:ui:visual` завершився успішно в pinned Docker image `linux/amd64`: 3 tests passed, усі 33 screenshot comparisons пройшли з допуском 0.1%. Наявні baselines не оновлювалися. Playwright report: `playwright-report/linux/index.html`.
- Переглянуто desktop і 320px reference captures у Dark, Light та Violet, а також Light overview і Dark/Violet modal baselines. У переглянутих прикладах немає обрізаних чи накладених елементів. Попередні sandbox-помилки `EPERM` на порту 6008 та `permission denied` для Docker більше не блокують перевірку.
- Storybook build попереджає про tooling chunks понад 500 kB. Screen-reader і Firefox/WebKit залишаються поза перевіреним обсягом.

## Виправлення після review, 2026-10-29

Іконки знову використовують inline SVG і semantic colors; browser regressions перевіряють painted stroke для hover, disabled, destructive і checked states. Logo, boxed-plus і avatar реагують на перевизначення токенів без зміни назви теми. Focus width/offset читаються з токенів; перевірено значення 3px/5px. FormField label і Modal description повернуто line-height 21px. Десять marker classes без consumers видалено.

CI викликає `npm run test:ui:ci`. Harness імпортує chromium із прямої залежності `@playwright/test` і більше не дублює обхід stories. Кожна story має власний Playwright test, timeout і trace при помилці. Contract harness залишається subprocess із власним browser context; він не успадковує `use` settings або автоматичний trace Playwright fixture.

Lint, 13 unit tests, TypeScript, app і Storybook builds пройшли. Фінальний запуск `test:ui:ci` у pinned `linux/amd64` image: 247 passed, включно з 77 stories × 3 theme settings, open-modal axe, 9 новими regression tests, contracts і 33 screenshot comparisons. Pinned examples зберігають власну тему. Перед цим переглянуто й оновлено 15 baselines із виправленими кольорами та line-height; фінальний run виконувався без snapshot updates. Report: `playwright-report/linux/index.html`.

## Початкові перевірки та межі — 2026-10-25

Результати фінальної перевірки записуються нижче. Не заявляємо повного accessibility audit або screenshot fidelity; screen-reader, кросбраузерні та повні візуальні порівняння залишаються поза виконаним QA.

- Node 24.22.1: app build (TypeScript включно зі stories), ESLint, Vitest — 2 files / 11 tests passed (10 нових + 1 існуючий).
- Static Storybook build — passed; стандартне попередження про chunks >500 kB у tooling preview, не app build.
- Chromium headless shell 141 / Playwright 1.56.1, GPU disabled: усі **37 UI stories × 3 themes** завершилися `storyFinished: success`, зокрема play assertions. Немає runtime page errors.
- У кожній темі: Enter/Space для Button, disabled/loading guard, controlled Input/Textarea та help/error associations, disabled fields; modal heading/explicit field initial focus, Tab/Shift+Tab containment, Escape/close/action dismissal і focus return. Native dialog alone спочатку дозволяв Tab cycle до browser chrome; додано та повторно перевірено edge wrapping.
- 320×400: long modal прокручується, final action доступний, clearance ≥16px; overview не має horizontal overflow. Poppins load та primary computed colors перевірені. Screenshots створено для desktop/narrow у трьох темах; це smoke QA, не pixel comparison.
- Reproducible runner: `scripts/ui-kit-browser.cjs`; локальні screenshots/results — `/tmp/taskpro-ui-kit-qa/`. Playwright/browser provisioning не включено в npm test або CI. Screen-reader, Firefox/WebKit, nested-dialog orchestration та повний contrast/accessibility audit не перевірялися.

## Figma review implementation — 2026-10-25

Implemented the requested review fixes against the sealed `1058:10396` context, SVGs and screenshot. Existing focus, disabled/loading, modal keyboard handling and readable text adaptations remain. No dependencies or lockfile changes were needed.

| Component        | Added contract                                                                                                                                                                                                                                                                                                       |
| ---------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button           | `leadingIcon` (including `boxed-plus`), `fullWidth`, `variant="ghost"`. Create specimen: 302×49, 28px boxed plus, 8px gap. Width is a consumer choice.                                                                                                                                                               |
| IconButton       | `iconSize`, `treatment="compact-add"`: visible 40×36 / radius 6 within a 44×44 hit area. Violet uses #b8bcfd / #979cea. Ghost actions retain their requested glyph size.                                                                                                                                             |
| Input / Textarea | Empty resting borders retain readable neutral tokens; focused or populated fields use the theme accent. Error/disabled styling takes precedence. A blank default placeholder enables native `:placeholder-shown` for controlled and uncontrolled fields. Dark field surface is #1f1f1f; light/violet is transparent. |
| Logo             | 32px source mark and Poppins 600 wordmark. Intended for `--surface-sidebar`; violet text is white.                                                                                                                                                                                                                   |
| LogoutButton     | Unframed 32px source icon, 16px label, 14px gap; sidebar text/focus tokens. Consumer supplies `onClick`.                                                                                                                                                                                                             |
| Avatar           | 68×68 source placeholder or cropped image; `name` supplies the image name. Failed URLs fall back to the source silhouette.                                                                                                                                                                                           |
| AvatarUpload     | `onFileSelect(file)`, `disabled`, `uploadLabel`; 24px add tile at source position within a 44px target. Selection does not upload data: consumer owns validation, preview and persistence. Selecting the same file again is supported.                                                                               |
| PriorityControl  | Controlled `value` (`none`, `low`, `medium`, `high`) and `onChange`; optional `name`, `label`, `disabled`. Source 14px swatches and 8px selected dot; native radio keyboard handling.                                                                                                                                |
| BoardIconPicker  | Controlled `value` (`project`, `star`, `loading`, `puzzle`, `container`, `lightning`, `colors`, `hexagon`) and `onChange`; optional `name`, `label`, `disabled`. Native radio group with 18px source glyphs. Selected outline is an interaction adaptation.                                                          |
| Icon             | Added filter, edit, move, bell, logout, eight board icons, logo, avatar and boxed-plus geometries. All 19 assets have source hashes in `ui-kit-assets.json`. Ordinary icons inherit color; branded graphics use separate semantic roles.                                                                             |

The green hover #9dc888 and compact violet hover #979cea were sampled from flat interior regions of the verified retained screenshot (936×1024 export of the 1440×1577 frame), not inferred from ambiguous generated variant names. Violet primary hover remains the existing #4649a6 readable-text adaptation. Neutral resting borders, readable muted/icon colors, labels and hit-area spacing remain explicit adaptations; this is not a claim of exact pixel identity.

Storybook: **UI / Design reference / Kit**, Branding, Selection controls, Disabled selections, Upload avatar, Disabled upload, Missing avatar; plus Button/Create, IconButton/Compact add, IconButton/Edit, Input/Filled and Icon/Inventory. The reference layout uses real components and sidebar surfaces; it does not recreate the Figma presentation canvas or its purple editor outlines. Modal close now uses the unframed action treatment with an 18px source glyph.

Browser verification is integrated into `scripts/ui-kit-browser.cjs` via `scripts/ui-kit-design-checks.cjs`. It checks reference geometry, theme hover colors, empty/focused/filled input borders, logo/avatar dimensions, independent native radio keyboard selection, image selection/preview/fallback, disabled controls and 320px overflow. It saves reference, narrow and hover screenshots in each theme alongside the existing interaction suite.

### Verification of the review fixes

- Node 24.22.1: ESLint, TypeScript, 13 tests across two files, production app build and static Storybook build passed. The existing test fixture still emits its uncontrolled-to-controlled input warning; Storybook retains its tooling chunk-size warning.
- Chromium headless, GPU disabled: **51 UI stories × 3 themes** completed successfully with no runtime page errors. The source geometry/color checks and existing keyboard/modal checks passed in every theme.
- Visually inspected the reference screenshots in Dark, Light and Violet, including the narrow Violet layout. Captures and machine-readable results: `/tmp/taskpro-kit-design-qa/`. This is component-reference verification, not a full application or cross-browser accessibility audit.
- Rechecked all 1025 sealed files and all 19 UI asset source hashes. Builds and browser checks ran under 8 GiB / 256-task / 15-minute limits; peak memory was 1.2 GiB for Storybook and 845 MiB for browser QA.

## Структура компонентів

Кожен компонент має каталог у `src/components/ui` з реалізацією, `index.ts`, stories та доречними tests/supporting files:

```text
ui/
  Button/
    Button.tsx
    button-variants.ts
    Button.stories.tsx
    Button.test.tsx
    index.ts
  Icon/
    Icon.tsx
    icon-data.tsx
    ...
  FormField/
    FormField.tsx
    field-context.ts
    ...
  cn.ts
  control-styles.ts
  index.ts
```

Компонентних CSS-файлів немає. Utility classes живуть у компонентах і CVA; шрифти, palette, themes і Tailwind mapping залишаються у `src/styles`. Input і Textarea використовують `fieldStyles`, FormField надає їм field context. Cross-component examples живуть у `src/stories/ui-kit`. Імпорти через `src/components/ui` та окремі component folders підтримуються.

Історична перевірка перенесення в component folders 2026-10-25 охоплювала lint, TypeScript, 13 тестів, app/Storybook builds і 51 story у трьох темах. Її результати не замінюють перевірку поточного Tailwind/CVA рефакторингу.
