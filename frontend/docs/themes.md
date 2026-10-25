# Storybook і спільні теми

З `frontend/`, Node **24.22.1**: `npm ci`, `npm run storybook` (http://127.0.0.1:6006; браузер автоматично не відкривається). `npm run build-storybook` створює `storybook-static/`; для локального перегляду: `python -m http.server 6006 --bind 127.0.0.1 --directory storybook-static`. Build не публікує сайт. `npm run build`, `npm run lint`, `npm test -- --run` перевіряють frontend. Storybook config входить у TypeScript build.

## Контракт

`src/index.css` імпортує `src/styles/palette.css` і `src/styles/themes.css` для застосунку та `.storybook/preview.ts`. Storybook React/Vite використовує існуючий Vite config з Tailwind 4. Один `Foundation/Theme tokens` specimen демонструє поверхні, текст, рамку, акцент, priority і keyboard focus. Це не продуктова Card і не початок UI-kit. Його layout та system font технічні; відповідність типографіці Poppins не заявляємо.

Теми задаються **на html**: `document.documentElement.dataset.theme = 'dark'` (також `light`, `violet`). HTML застосунку починає з Dark; CSS має Dark fallback. Toolbar Dark / Light / Violet використовує `withThemeByDataAttribute` на html preview iframe. Менеджер Storybook має власний UI; теми застосовуються до preview. Немає app theme picker, storage або profileAPI policy.

Компоненти споживають семантичні ролі, наприклад `background: var(--surface-card); color: var(--text-primary); border-color: var(--border-subtle)`. У Tailwind можна писати `bg-[var(--surface-card)] text-[var(--text-primary)]`. Не вставляйте raw hex чи palette tokens безпосередньо в продуктову компоненту. Sidebar використовує `--text-sidebar` на `--surface-sidebar`, а не content text.

Palette — сирі кольори; themes — рольове відображення. Назви семантичних токенів **наші**, це не оригінальні Figma variable names. Додаючи роль: перевірте конкретний source node, додайте palette value лише за потреби, визначте роль в усіх трьох темах, запишіть provenance або derived/open, перевірте контраст на фактичній поверхні. Не підміняйте рольовий alpha глобальним opacity.

## Джерела

Оригінальний незмінений export: `/home/vlad/Documents/Codex/taskpro-next-spec/`. `DESIGN.md`, розділ **Theme and typography contract**, і `design-pack/captures.json` — індекс 48 captures. FREEZE SHA-256: `8a34d3559079e645f69270d69c757b4885685f10a18e7273a79441588c2654ac`; під час цієї роботи перевірено всі 1025 hashes без розбіжностей. Використані тільки color/token data та provenance; generated JSX і business code не копіювалися. Live Figma MCP не використовувався.

Шляхи нижче відносні до export:

| Ролі                                                                          | Source contexts                                                                                                       |
| ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| Canvas, sidebar, header, card, column heading, content/sidebar text, priority | `design-pack/captures/retained-2026-10-17/{1058-1862,1058-2287,1058-2745}/content-0.txt`                              |
| Violet header tablet/mobile                                                   | `design-pack/screens/captures/1058-7795/content-0.txt`, `design-pack/captures/new-2026-10-18/1058-9676/content-0.txt` |
| Filters surface, border/shadow, caption alpha                                 | `design-pack/screens/captures/{1058-3594,1058-3618,1058-3690}/content-0.txt`                                          |
| Accent palette / UI-kit examples                                              | `design-pack/captures/new-2026-10-18/1058-10396/content-0.txt`                                                        |

| Роль                  | Dark              | Light                 | Violet                   |
| --------------------- | ----------------- | --------------------- | ------------------------ |
| Canvas                | #1f1f1f           | #f6f6f7               | #ecedfd                  |
| Sidebar               | #121212           | #ffffff               | #5255bc                  |
| Header                | #161616           | #fcfcfc               | #fcfcfc; ≥1440px #ffffff |
| Card / column heading | #121212           | #ffffff               | #ffffff                  |
| Content text          | #ffffff           | #161616               | #161616                  |
| Sidebar text          | #ffffff           | #161616               | #ffffff                  |
| Filters               | #151515           | #fcfcfc               | #fcfcfc                  |
| Action / foreground   | #bedbb0 / #161616 | #bedbb0 / #161616     | #5255bc / #ffffff        |
| Description           | white 50%         | #161616 70%           | #161616 70%              |
| Caption               | white 50%         | #161616 50%           | #161616 50%              |
| Sidebar muted         | white 50%         | #161616 50%           | white 50%                |
| Filters border        | #bedbb0 50%       | transparent           | transparent              |
| Filters shadow        | none              | 0 4px 16px #161616 5% | 0 4px 16px #161616 5%    |
| Priority none         | white 30%         | #161616 30%           | #161616 30%              |

Priority low #8fa1d0, medium #e09cb5, high #bedbb0; завжди додавайте текстову назву, не лише колір. Caption і description — різні ролі. Джерельні напівпрозорі підписи не гарантують WCAG contrast на довільній поверхні. Filters light/violet не мають dark green border; transparent зберігає відсутність видимої рамки.

## Адаптації та відкриті питання

- `--border-subtle` (20%) — **derived** декоративна рамка technical specimen; не замінює контрастну межу інтерактивного control.
- `--focus-ring*` — **derived**: 2px + 2px offset, white на dark/sidebar violet, #161616 на light/violet content. Компонента має вибрати відповідну роль і перевірити фактичну поверхню. Це не Figma active-field state.
- UI-kit містить #7b7ede, але його призначення як Violet hover — адаптація. Green hover brightness 1.05 та error #ff9b9b/#b42318 також адаптації. Hover/error/disabled API тут **не реалізовані**: залишені наступним component tasks разом із перевірками контрасту й поведінки.
- 40% opacity normal-field group не переноситься на filled/active fields. Auth #151515/#1f1f1f не означає три auth variants; auth компоненти та токени не входять у цю основу.
- Poppins 400/500/600 спостерігається у джерелі, але font binaries/typography system не імпортовані в цьому color-only scope.

Підхід до спільного CSS, themes/decorators та palette specimen натхненний [Steve Kinney — Building Design Systems in Storybook](https://stevekinney.com/courses/storybook); конфігурація адаптована за [Storybook React/Vite docs](https://storybook.js.org/docs/get-started/frameworks/react-vite). Курс і його UI-kit не копіюються; Chromatic/Figma integrations не додані.

## Виконані перевірки — 2026-10-25

На Node 24.22.1: app build + TypeScript (включно з Storybook config), static Storybook build, ESLint та наявний Vitest test — успішно (1 файл / 1 тест). Storybook dev також запущений успішно. Існуючі locked-версії пакетів не змінено.

Headless Chromium shell 141, Playwright 1.56.1, `--disable-gpu --disable-software-rasterizer`: на dev і static build toolbar послідовно перемкнув Light → Violet → Dark. Перевірені html data-theme, computed body background/text, action background і focus outline 2px; runtime page errors не виявлено. Для Violet перевірено header token на 375/768/1439px (#fcfcfc) і 1440px (#ffffff). QA tooling тимчасовий, не додає Playwright до залежностей проєкту.

Обмеження: це функціональний smoke QA, не screenshot/pixel comparison чи повний accessibility audit. GPU/desktop browser не запускався. Static build має стандартне попередження про chunk >500 kB у Storybook preview. Системний Node 25 давав engine warning при початковому install; build/lint/test виконано на заявленому Node 24.22.1.
