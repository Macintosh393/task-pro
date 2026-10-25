# Спільний UI-kit — локальна пропозиція

Реалізація для review у `ui-kit`, не прийняття ADR командою. Немає API, auth/business forms, карток/колонок, datepicker чи Stack/Grid. Імпорти: `src/components/ui`. Застосунок і Storybook завантажують один `src/index.css`; компонентні стилі не живуть у stories.

## Контракти

| Компонент        | API / поведінка                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text             | `as="p"/"span"`, `size="small"/"medium"`, `tone="primary"/"muted"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| Heading          | `level={1..6}` незалежно від `size="small"/"medium"/"large"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Button           | Native button props/ref, `type="button"` за замовчуванням, явний `type="submit"` для форми. `variant="primary"/"secondary"/"destructive"/"ghost"`, `size="small"/"medium"`, `disabled`, `loading`. Loading зберігає label/розмір, додає progress mark та `aria-busy`, вимикає повторну активацію. Consumer відповідає за початок/завершення async стану.                                                                                                                                                                                                         |
| IconButton       | Ті самі variants/states, обов’язкові `icon` і `aria-label`. Мінімальна hit area 44×44.                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Icon             | TaskPro action/board icons, `size={10/16/18/20/24/28/32/68}`; `currentColor`. Без `label` декоративний; із `label` — `role="img"`. У вже названій кнопці не додавайте label іконці.                                                                                                                                                                                                                                                                                                                                                                              |
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

Test approach для локального review: Vitest + jsdom + `react-dom/client` / React `act`, без React Testing Library. jsdom — dev-only DOM environment; він не доводить native modal containment, browser layout чи keyboard default actions. Для цього є `scripts/ui-kit-browser.cjs` з Playwright, встановленим окремо від runtime/project dependencies. Docs addon 10.6.3 потрібен для реальних autodocs; CVA, clsx, icon/dialog runtime libraries не додаються. Існуючі lockfile versions не змінено.

З `frontend`, Node 24.22.1:

```sh
npm ci
npm run dev
npm run storybook
npm run build
npm run build-storybook
npm run lint
npm test -- --run
```

Storybook: http://127.0.0.1:6006, `UI/Overview` і окремі компоненти; Dark/Light/Violet у toolbar. Для static QA:

```sh
python -m http.server 6008 --bind 127.0.0.1 --directory storybook-static
NODE_PATH=/path/to/qa/node_modules PLAYWRIGHT_BROWSERS_PATH=/path/to/qa/browsers node scripts/ui-kit-browser.cjs
```

QA використовує headless Chromium з `--disable-gpu --disable-software-rasterizer`; не запускайте desktop browser для цих перевірок. `UI_KIT_URL` змінює loopback URL, `UI_KIT_QA_OUTPUT` — каталог screenshots/results (default `/tmp/taskpro-ui-kit-qa`). Playwright не є runtime dependency. Це локальна команда, CI browser provisioning ще не налаштовано.

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

## Component folder layout

Each production component has one folder under `src/components/ui`, with its implementation, `index.ts`, CSS, and any component stories/tests/supporting data:

```text
ui/
  Button/
    Button.tsx
    Button.css
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
  index.ts
```

Text/Heading, Avatar/AvatarUpload and PriorityControl/BoardIconPicker are separate components and folders. Public imports such as `import { Button } from '.../components/ui'` remain supported; component-folder imports also work. Internal dependencies use sibling component folders.

`src/styles/ui-kit.css` imports the colocated component styles for both app and Storybook. Shared fonts/body defaults (`ui-foundation.css`), radio-group scaffolding (`choice-controls.css`), palette and theme tokens stay centralized. Input owns the shared `.ui-control` styles used by Textarea; Textarea owns its multiline overrides. FormField owns the field context used by both controls. Icon owns the sourced SVG inventory used by the brand/avatar components.

Cross-component showcase stories live in `src/stories/ui-kit` with their reference-layout CSS. Story titles/IDs are unchanged. Existing component/composition tests are colocated with their primary component; `src/test/setupDomTest.ts` provides their shared DOM lifecycle. No UI behavior or API change is intended by this move.

Folder-refactor validation: ESLint, TypeScript, all 13 tests (now colocated across seven test files including the existing service test), and app/Storybook builds passed. The extracted CSS selector/declaration sets match the pre-move styles.
Browser verification also passed for all 51 stories in all three themes, including geometry/state and keyboard checks. Results and screenshots: `/tmp/taskpro-ui-folders-qa/`.
