# Спільний UI-kit — локальна пропозиція

Реалізація для review у `ui-kit`, не прийняття ADR командою. Немає API, auth/business forms, карток/колонок, datepicker чи Stack/Grid. Імпорти: `src/components/ui`. Застосунок і Storybook завантажують один `src/index.css`; компонентні стилі не живуть у stories.

## Контракти

| Компонент        | API / поведінка                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Text             | `as="p"/"span"`, `size="small"/"medium"`, `tone="primary"/"muted"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Heading          | `level={1..6}` незалежно від `size="small"/"medium"/"large"`; native props/ref                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Button           | Native button props/ref, `type="button"` за замовчуванням, явний `type="submit"` для форми. `variant="primary"/"secondary"/"destructive"`, `size="small"/"medium"`, `disabled`, `loading`. Loading зберігає label/розмір, додає progress mark та `aria-busy`, вимикає повторну активацію. Consumer відповідає за початок/завершення async стану.                                                                                                                                                                       |
| IconButton       | Ті самі variants/states, обов’язкові `icon` і `aria-label`. Мінімальна hit area 44×44.                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Icon             | `name="plus"/"close"/"trash"`, `size={16/18/20/24}`; `currentColor`. Без `label` декоративний; із `label` — `role="img"`. У вже названій кнопці не додавайте label іконці.                                                                                                                                                                                                                                                                                                                                             |
| FormField        | Один Input або Textarea, `label`, опційні `help`, `error`, `id`. Generated `useId` зв’язує label/help/error. Явний id передавайте FormField; child id усередині нього ігнорується.                                                                                                                                                                                                                                                                                                                                     |
| Input / Textarea | Native props/ref, controlled або uncontrolled. Context додає id, invalid, об’єднує help/error з зовнішнім `aria-describedby`. Поза FormField consumer сам додає label або aria-label. Немає бізнес-валідації.                                                                                                                                                                                                                                                                                                          |
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
- Source: існуючі surface/text/action colors через semantic tokens; оригінальні SVG path/viewBox із provenance у [ui-kit-assets.json](ui-kit-assets.json). Inline SVG змінює тільки color на currentColor, видаляє export IDs і 50% opacity trash. Немає вигаданого asset library.
- Derived: control border #929292 dark / #767676 light, readable muted text #b8b8b8 / #626262; не переносимо 40% opacity source field на весь control. Error/destructive #ff9b9b dark / #b42318 light, foreground і hover, disabled background/text, backdrop, spinner, focus та active inset — UI-kit adaptations.
- Derived green hover #c8e6ba наближує попередній brightness 1.05. Violet hover **#4649a6**, а не раніше запропонований #7b7ede: останній недостатньо контрастний із білим 14px label. #7b7ede залишається documented source palette value, але не використовується як hover цієї кнопки. Це навмисне відхилення для читабельності, не уточнена Figma variable.
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

## Перевірки та межі — 2026-10-25

Результати фінальної перевірки записуються нижче. Не заявляємо повного accessibility audit або screenshot fidelity; screen-reader, кросбраузерні та повні візуальні порівняння залишаються поза виконаним QA.

- Node 24.22.1: app build (TypeScript включно зі stories), ESLint, Vitest — 2 files / 11 tests passed (10 нових + 1 існуючий).
- Static Storybook build — passed; стандартне попередження про chunks >500 kB у tooling preview, не app build.
- Chromium headless shell 141 / Playwright 1.56.1, GPU disabled: усі **37 UI stories × 3 themes** завершилися `storyFinished: success`, зокрема play assertions. Немає runtime page errors.
- У кожній темі: Enter/Space для Button, disabled/loading guard, controlled Input/Textarea та help/error associations, disabled fields; modal heading/explicit field initial focus, Tab/Shift+Tab containment, Escape/close/action dismissal і focus return. Native dialog alone спочатку дозволяв Tab cycle до browser chrome; додано та повторно перевірено edge wrapping.
- 320×400: long modal прокручується, final action доступний, clearance ≥16px; overview не має horizontal overflow. Poppins load та primary computed colors перевірені. Screenshots створено для desktop/narrow у трьох темах; це smoke QA, не pixel comparison.
- Reproducible runner: `scripts/ui-kit-browser.cjs`; локальні screenshots/results — `/tmp/taskpro-ui-kit-qa/`. Playwright/browser provisioning не включено в npm test або CI. Screen-reader, Firefox/WebKit, nested-dialog orchestration та повний contrast/accessibility audit не перевірялися.
