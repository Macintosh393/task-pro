# Аудит UI-kit за курсом Steve Kinney

Дата: 2026-10-29, Europe/Kyiv. Перевірена версія: [main, 4d8f9ff](https://github.com/Macintosh393/task-pro/commit/4d8f9ffc129c233f3dc08c4487022233ae5d24a1).

Прочитано всі 32 уроки з [індексу курсу](https://stevekinney.com/courses/storybook) та шість додаткових сторінок, на які посилаються уроки. Окремий відеокурс Frontend Masters не переглядався. Це статичне зіставлення вихідного коду та конфігурації з письмовим курсом; тести й браузерні перевірки в межах аудиту не запускалися.

## Висновок

UI-kit використовує основні підходи курсу, але не реалізує весь описаний процес розробки й перевірки. Найпомітніші прогалини: автоматичні accessibility-аудити, відтворюваний запуск story-тестів із залежностями проєкту, порівняння screenshot baselines і окрема документація частини компонентів.

Tailwind встановлений і підключений через Vite та `src/index.css`. Проте UI-компоненти стилізовані власними CSS-класами. CVA не використовується. Це відрізняється від пізніших прикладів курсу, але курс прямо дозволяє інші засоби стилізації. Водночас [TECH.md](../../TECH.md) обирає саме Tailwind utilities та CSS custom properties, тому поточний підхід потребує узгодження з власною документацією проєкту.

## Що перевірено в репозиторії

Python census усіх `frontend/src/**/*.stories.tsx` і каталогів `components/ui` дав такі результати:

| Об'єкт | Кількість |
| --- | ---: |
| UI-компоненти | 15 |
| Story-файли | 12 |
| Іменовані stories | 52 |
| Stories у групі UI | 51 |
| Foundation stories | 1 |
| Компоненти з власними stories та autodocs | 9 |
| Компоненти лише у спільних showcase stories | 6 |
| Play functions | 5 |
| Play functions з assertions | 2 |
| Play functions лише для встановлення focus | 3 |
| UI test-файли | 6 |
| Інші frontend test-файли | 1 |
| MDX-файли | 0 |

Компоненти без власних stories: Avatar, AvatarUpload, BoardIconPicker, Logo, LogoutButton, PriorityControl. Вони представлені в [DesignReference.stories.tsx](../src/stories/ui-kit/DesignReference.stories.tsx), тому це прогалина індивідуальних controls/API docs, а не повна відсутність прикладів.

## Основні відмінності

### Tailwind і CVA

[Adding variants](https://stevekinney.com/courses/storybook/adding-variants) починає з CSS modules і дозволяє будь-який спосіб стилізації. [Урок CVA](https://stevekinney.com/courses/storybook/class-variance-authority) показує спільне визначення base styles, variants, defaults, compound variants та виведення типів через `VariantProps`. Автор прямо зазначає, що CVA працює і без Tailwind.

У нас [Button.tsx](../src/components/ui/Button/Button.tsx) окремо визначає union типів, default props і складання рядка класів; стилі variants живуть у [Button.css у перевіреній версії](https://github.com/Macintosh393/task-pro/blob/4d8f9ffc129c233f3dc08c4487022233ae5d24a1/frontend/src/components/ui/Button/Button.css), а список controls повторюється в stories. CVA міг би прибрати дублювання типів і конфігурації variants. Він не потрібен кожному компоненту й сам по собі не виправить gaps у тестуванні.

[package.json](../package.json), [vite.config.ts](../vite.config.ts) і [index.css](../src/index.css) підтверджують інтеграцію Tailwind 4. Власні semantic tokens не мають окремого Tailwind `@theme` mapping. Для переходу на utility-first компоненти потрібно зберегти контракт цих токенів і трьох тем. Копіювати старий `tailwind.config.ts` із курсу без адаптації до встановленої версії не слід.

[ui-kit.md](ui-kit.md) прямо фіксує попереднє рішення не додавати CVA та clsx. Отже, це збережений вибір мінімальної реалізації, а не ознака втраченого коміту.

### Автоматичні перевірки

[Урок accessibility](https://stevekinney.com/courses/storybook/accessibility-testing) додає axe-аудит у Storybook і тестовий запуск. У нас немає відповідного addon або axe-перевірок. Код має accessible names, field associations, native controls та keyboard/focus checks; це корисне покриття, але воно не замінює автоматичний аудит і ручні перевірки.

[Урок test runner](https://stevekinney.com/courses/storybook/test-runner) рекомендує автоматичний запуск stories та package script. Наш [browser script](../scripts/ui-kit-browser.cjs) проходить усі UI stories у трьох темах, перевіряє завершення play functions і окремо тестує клавіатуру, поля та modal. Однак Playwright потрібно надавати через зовнішній `NODE_PATH`; у package scripts немає story-test команди, у поточному дереві немає `.github` workflows. Це часткова реалізація процесу, а не відсутність тестів.

[Урок visual tests](https://stevekinney.com/courses/storybook/visual-tests) порівнює screenshots із затвердженою версією. Наші scripts зберігають screenshots і перевіряють окремі кольори та геометрію, але не виконують baseline image comparison. Chromatic або еквівалентний механізм visual regression не налаштований у репозиторії.

### Документація та controls

Дев'ять компонентів мають autodocs. Решта шість мають лише спільні приклади. [MDX-урок](https://stevekinney.com/courses/storybook/mdx) показує поєднання usage guidance, stories і controls в одному каталозі. У нас докладні правила є в Markdown поза Storybook, але MDX не включений у [story glob](../.storybook/main.ts).

Є конкретна розбіжність controls: [IconProps](../src/components/ui/Icon/Icon.tsx) дозволяє розміри 10, 16, 18, 20, 24, 28, 32, 68, але [Icon stories](../src/components/ui/Icon/Icon.stories.tsx) пропонують лише 16, 18, 20, 24. Це звужує доступну для дослідження API в Storybook. Власні stories для нових компонентів і синхронізація controls корисніші, ніж механічне додавання MDX до кожного файлу.

## Зіставлення всіх 32 уроків

Статус «альтернатива» означає іншу реалізацію тієї самої мети. «За потреби» означає техніку, яка не потрібна кожному primitive.

| Урок | Стан TaskPro |
| --- | --- |
| [Setting up](https://stevekinney.com/courses/storybook/setting-up) | Є React/Vite integration, main/preview, dev/build scripts. |
| [Sandboxes](https://stevekinney.com/courses/storybook/sandboxes) | За потреби; окремий sandbox не є вимогою до продукту. |
| [Writing stories](https://stevekinney.com/courses/storybook/writing-stories) | Є typed Meta/StoryObj, CSF exports та args. |
| [Variants](https://stevekinney.com/courses/storybook/adding-variants) | Є variant props, native props, interaction styles і variant stories. Класи складаються вручну. |
| [Controls](https://stevekinney.com/courses/storybook/controls) | Є в дев'яти component story-файлах; нові showcase-only компоненти не мають власних controls. |
| [Button sizes](https://stevekinney.com/courses/storybook/adding-button-sizes-exercise) | Є small/medium та control. Точний набір розмірів із вправи не обов'язковий. |
| [Default args](https://stevekinney.com/courses/storybook/default-args) | Є shared meta args. Відсутність окремої story кожного розміру сама по собі не є порушенням. |
| [Tailwind/themes](https://stevekinney.com/courses/storybook/setting-up-tailwind) | Є shared stylesheet import і theme addon; компоненти використовують CSS. |
| [Custom colors](https://stevekinney.com/courses/storybook/customizing-tailwind-colors) | Є semantic palette; немає mapping/restriction палітри Tailwind, показаних у курсі. |
| [Fonts](https://stevekinney.com/courses/storybook/importing-fontsource-fonts) | Альтернатива: локальні Poppins 400/500/600 через shared CSS замість Fontsource. |
| [MDX](https://stevekinney.com/courses/storybook/mdx) | Частково: autodocs та зовнішні Markdown guides; немає MDX usage pages у каталозі. |
| [argTypes](https://stevekinney.com/courses/storybook/arg-types) | Є controls й окремі descriptions; документація API нерівномірна, Icon size control неповний. |
| [Color palette](https://stevekinney.com/courses/storybook/color-palette) | Частково: Foundation показує surfaces/priorities, але не повний каталог токенів. |
| [Icon gallery](https://stevekinney.com/courses/storybook/icon-gallery) | Є Inventory з назвами; brand/avatar assets показані в інших examples. |
| [Typeset](https://stevekinney.com/courses/storybook/typeset) | Є custom TypeSet story з Text і Heading. |
| [Hierarchy](https://stevekinney.com/courses/storybook/naming-and-hierarchy) | Є Foundation/UI hierarchy, component folders та composition stories. |
| [CVA](https://stevekinney.com/courses/storybook/class-variance-authority) | Не застосовано; ручні types/defaults/class strings та CSS variants. |
| [CVA sizes](https://stevekinney.com/courses/storybook/adding-a-size-variant) | Не застосовано; size union заданий вручну. |
| [Dark components](https://stevekinney.com/courses/storybook/adding-dark-mode-to-our-components) | Альтернатива: компоненти споживають semantic tokens для Dark/Light/Violet. |
| [Forced dark mode](https://stevekinney.com/courses/storybook/forcing-dark-mode) | Немає pinned theme/viewport stories; browser QA задає themes і вузький viewport програмно. |
| [Alternative dark mode](https://stevekinney.com/courses/storybook/dark-mode-alternative) | Відповідає підходу: CSS variables змінюються через theme selector. |
| [Callout exercise](https://stevekinney.com/courses/storybook/callout-component-exercise) | Немає Callout; вправа не встановлює обов'язкового продуктового компонента. |
| [Play functions](https://stevekinney.com/courses/storybook/play-functions) | Частково: п'ять functions, дві з assertions. Інші сценарії покриває browser script. |
| [Component tests](https://stevekinney.com/courses/storybook/testing-components-with-storybook) | Є assertions і DOM tests; підхід до queries відрізняється. TECH.md виключає React Testing Library. |
| [Test runner](https://stevekinney.com/courses/storybook/test-runner) | Частково: custom browser runner; немає project-owned Playwright dependency, package script або repo CI. |
| [Visual tests](https://stevekinney.com/courses/storybook/visual-tests) | Немає порівняння baseline screenshots. Збереження captures та geometry checks уже є. |
| [Accessibility](https://stevekinney.com/courses/storybook/accessibility-testing) | Немає axe-аудитів; є native semantics і спеціальні keyboard/ARIA checks. |
| [Decorators](https://stevekinney.com/courses/storybook/decorators) | Є global theme decorator та wrappers; FormField забезпечує field context. |
| [Loaders](https://stevekinney.com/courses/storybook/loaders) | За потреби; поточні primitive stories не потребують API-data loading. |
| [MSW](https://stevekinney.com/courses/storybook/mock-service-worker) | За потреби; для поточних stories немає потреби мокати backend requests. |
| [Storybook in Figma](https://stevekinney.com/courses/storybook/storybook-in-figma) | Не підтверджено; потрібна перевірка самого Figma-файлу, з репозиторію цього не видно. |
| [Figma in Storybook](https://stevekinney.com/courses/storybook/figma-in-storybook) | Немає Designs addon/embedded Figma panel. Локальний reference showcase та asset provenance не дають цієї інтеграції. |

Додатково прочитано [size solution](https://stevekinney.com/courses/storybook/adding-button-sizes-solution), [palette solution](https://stevekinney.com/courses/storybook/color-palette-solution), [icon implementation](https://stevekinney.com/courses/storybook/creating-an-icon-component), [callout solution](https://stevekinney.com/courses/storybook/callout-component-solution), [disabled-textarea solution](https://stevekinney.com/courses/storybook/text-area-disabled-play-function-solution) та [parameters](https://stevekinney.com/courses/storybook/parameters). Їхні відповідні аспекти враховані вище.

## Рекомендація

Якщо мета команди полягає у практиці стеку з TECH.md і пізніх прикладів курсу, доцільно перейти на Tailwind для компонентів і CVA для компонентів із кількома variants. Це окреме архітектурне рішення; його слід узгодити з draft ADR і зберегти чинні semantic tokens, native props та поведінку трьох тем.

Для надійності UI-kit пріоритет мають project-owned browser test command, accessibility audits, baseline visual comparisons і документація шести showcase-only компонентів. Заміна CSS на CVA/Tailwind цих прогалин не закриває. API та конфігурацію для будь-якої реалізації потрібно звірити з установленими Storybook 10 і Tailwind 4, оскільки курс містить приклади попередніх версій.
