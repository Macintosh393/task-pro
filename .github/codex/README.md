# Codex review

Workflow використовує власний OpenAI API key через [офіційний Codex Action](https://learn.chatgpt.com/docs/github-action). Виклики оплачуються як OpenAI API usage окремо від ChatGPT. Hosted команда `@codex review` має іншу інтеграцію й оплату.

## Налаштування

1. Злийте workflow у default branch. Автоматичний listener і `/codex-review` працюють після цього.
2. Додайте Actions repository secret `OPENAI_API_KEY` з ключем OpenAI project, що має API billing та доступ до моделі. Не записуйте ключ у код, PR, коментарі чи чат. Workflow без secret завершиться з поясненням.
3. За потреби задайте repository variables `CODEX_REVIEW_MODEL` та `CODEX_REVIEW_EFFORT`. Без них використовується default закріпленого Codex CLI `0.167.0`. Доступність конкретної моделі визначається API project. Action закріплено на release v1 commit `bdf19a4a223ec2549a3e2274a0cf61556bc07675`.
4. Налаштуйте ліміт витрат у OpenAI project та стежте за usage. Timeout і обмеження diff не є грошовим лімітом. Цей workflow не змінює billing, secrets чи repository settings.

## Запуск і повторна перевірка

Новий відкритий PR, reopening або перехід із draft запускає secretless `Codex review request`. Його завершення запускає trusted listener із default branch. Автоматичного review після кожного push немає.

Після виправлень залиште окремий top-level коментар `/codex-review` у PR conversation. Replies у review threads не запускають workflow. Інший спосіб: Actions → Codex review → Run workflow на default branch, поле `pull_request` із номером PR. Інший текст команди ігнорується. Автоматичний повтор для вже перевіреного HEAD пропускається. Явна команда чи dispatch дозволяє повторити review того самого HEAD після уточнення вимог або коментарів.

Ініціатор і автор PR повинні бути людьми з поточним repository permission `write`, `maintain` або `admin`. PR має бути відкритим, не draft, із гілки цього репозиторію в default branch. Fork PR та bots не підтримуються. `author_association` не дає доступу. Невідповідні запити пропускаються без звернення до OpenAI.

## Контекст і результат

Аналіз отримує опис PR, прямо згадані `#123` і same-repository issue URLs, поточні reviews та коментарі з replies. Контекст також містить канонічні filenames, rename paths і patches з GitHub PR files API. Git diff прив'язаний до merge-base і зафіксованого HEAD; релевантний source доступний через `git show`. Workflow не завантажує вміст зовнішніх документів чи linked PR як acceptance criteria. Максимум 10 issues, 100 змінених файлів, включно з видаленими, 250 KB diff та 200 KB metadata разом із канонічними GitHub file patches. Перевищення завершує запуск із помилкою, без прихованого обрізання контексту.

Codex шукає конкретні нові дефекти та порушення явних поточних вимог. До п'яти P0/P1/P2 findings публікуються одним `COMMENT` review. Якщо нових findings немає, оновлюється лише summary без порожнього review. Publisher перевіряє JSON, path, side, змінений рядок та актуальні base/head SHA. Канонічні filenames і anchors бере з GitHub PR files API; для перейменованого файла використовує новий filename навіть на LEFT. GitHub може не повернути patch для великого або binary файла, тоді inline finding для нього відкидається з поясненням у summary. LEFT прив’язує finding до видаленого рядка merge-base, RIGHT до доданого рядка PR head. Невалідний JSON не публікується; findings поза diff відкидаються з повідомленням у summary. Зміна HEAD або base під час аналізу скасовує публікацію.

Окремий підсумковий коментар оновлюється після review. Fingerprint нормалізованого path/title прибирає повтори bot findings у unresolved threads навіть після зміщення рядків; resolved threads перевіряються через GraphQL, тож дефект, який повернувся, можна повідомити знову; попередні reviews також входять у контекст. Перефразований моделлю дефект може потребувати ручного розпізнавання. Людські threads не закриваються. Відсутність старого finding у новій відповіді не означає, що його виправлено. Review не підтверджує проходження тестів, браузерну поведінку чи відповідність Figma.

## Межі доступу

PR code ніколи не checkout-иться та не виконується. Workflow, scripts і prompt беруться з зафіксованого commit default branch. PR head завантажується лише як Git objects для читання diff/source. Agent job має тільки read permissions, `:read-only` і `drop-sudo`; OpenAI key передається лише protected action input. Codex є останнім кроком job. Publisher виконує trusted script в окремому job із `pull-requests: write` без завантаження PR Git objects, перевіряє результат як дані й не застосовує patches. Workflow не approval-ить, не request-changes, не merge-ить і не запускає autofix.

На один PR одночасно працює не більше одного analysis job та одного publisher. GitHub concurrency може замінити старий pending запит новішим. Невелике вікно між останньою перевіркою SHA і GitHub API залишається; review явно прив'язаний до `commit_id`, тому не переносить findings на інший commit. Якщо atomic review опублікувався, а оновлення summary не вдалося, повторний запуск відкине вже наявні inline findings за fingerprint і відновить summary.

## Локальна перевірка

На Node.js `24.22.1`:

```sh
node --test .github/codex/review.test.mjs
```

Тести працюють із fixtures та mock API. Вони не викликають OpenAI й не публікують коментарів. Окремий `Codex review offline checks` запускає їх у CI для змін workflow/scripts. Перший реальний API review потребує налаштованого secret та окремого запуску після злиття.
