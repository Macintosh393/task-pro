# OpenAI API review

Workflow викликає [Responses API](https://developers.openai.com/api/docs/guides/function-calling) напряму й публікує review у GitHub PR. Це власний reviewer із трьома обмеженими source tools. Native інтеграція `@codex review` налаштовується окремо в Codex; Codex Action і CLI тут не використовуються. Команду `/codex-review` збережено для сумісності.

## Ключ, кредити й модель

1. Злийте workflow у default branch. Listener та команда працюють після цього.
2. Додайте repository Actions secret `OPENAI_API_KEY` із ключем потрібної OpenAI API organization/project. Не записуйте ключ у код, PR, коментарі чи чат. Без secret запуск завершується з поясненням.
3. Якщо використовуєте [API credits для ChatGPT subscribers](https://developers.openai.com/api/docs/guides/chatgpt-api-credits), переконайтеся, що benefit активний і ключ належить organization, пов'язаній із benefit. Responses API підтримується цією програмою, Codex usage через API keys виключено. Сам факт наявності ChatGPT підписки або ключа не підтверджує баланс, eligibility чи model access. Workflow цього не перевіряє; перевірте API billing і credit balance у відповідному акаунті. Без застосовного benefit це звичайне оплачуване API usage окремо від ChatGPT.
4. Default model [gpt-6.1-sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), reasoning effort `high`. Repository variables `CODEX_REVIEW_MODEL` та `CODEX_REVIEW_EFFORT` змінюють ці значення. Допустимі effort `low`, `medium`, `high`, `xhigh`, `max`; підтримку override визначає обрана API model. Недоступний model або несумісний effort завершує запуск без автоматичного fallback.

## Запуск і повторна перевірка

Новий відкритий PR, reopening або перехід із draft запускає secretless `Codex review request`. Його завершення запускає trusted listener `OpenAI API review` із default branch. Review після кожного push немає.

Після виправлень залиште окремий top-level коментар `/codex-review` у PR conversation. Replies у review threads не запускають workflow. Або відкрийте Actions → OpenAI API review → Run workflow на default branch і задайте номер PR у `pull_request`. Інший текст команди ігнорується. Автоматичний повтор для вже перевіреного HEAD пропускається; явний comment або dispatch дозволяє перевірити той самий HEAD після уточнень.

Автор PR та ініціатор повинні бути людьми з поточними permissions `write`, `maintain` або `admin`. PR має бути відкритим, не draft, із гілки цього репозиторію в default branch. Fork PR і bots не підтримуються. `author_association` не дає доступу. Невідповідні запити пропускаються без звернення до OpenAI.

## Доступний контекст

Початковий запит містить PR description, прямо згадані `#123` і same-repository issue URLs, поточні reviews, conversation/replies, стан resolved threads та canonical GitHub file patches. Повний local diff прив'язаний до merge-base і pinned HEAD. Tracked root AGENTS.md, README.md, TECH.md і CONTRIBUTING.md із trusted revision передаються повністю, якщо існують. Зовнішні документи та linked PR не завантажуються як acceptance criteria.

Для навігації модель має лише `list_source`, `read_source` і `search_source` на aliases `head`, `base` для merge-base, `trusted` для default branch. Tools читають Git objects, не worktree files. Regular UTF-8 blobs можна читати нумерованими рядками, шукати literal text або перелічувати paths. Модель може дослідити релевантні nested source, AGENTS і docs. Немає довільного shell, network, browser, filesystem чи environment access. PR code не checkout-иться, не встановлюється й не виконується; symlinks і submodules не розіменовуються.

Усі paths перевіряються як repository-relative. Alias задає лише зафіксований SHA; модель не може передати власний Git revision або команду. Git subprocess отримує мінімальний environment без API/GitHub tokens. Модель не запускає код; prompt injection у source може вплинути на якість висновків, але не відкриває додаткові tools чи permissions.

## Ліміти та помилки

Collector відхиляє більше 10 issues, 100 змінених файлів, 250 KB diff, 200 KB metadata із GitHub patches або 64 KB trusted root docs. Джерельний blob обмежено 128 KB, read до 200 рядків і 16 KB результату. List повертає до 100 paths за сторінку. Search перевіряє до 60 файлів і 1 MB source, повертає до 40 збігів; пропуски та обрізання явно позначені. Для завеликого запиту модель може звузити prefix або line range.

Максимум шість Responses requests, 30 tool calls, 8000 output tokens на request, 700 KB серіалізованого request context та 10 хвилин на API/tool loop. Окремий HTTP request має timeout до двох хвилин. Фінальний round вимикає tools. Це верхні межі використання, вони не є грошовим лімітом. Налаштуйте API spend limit та стежте за usage у потрібній organization.

Запити використовують `store:false`, strict function schemas і strict JSON `text.format`. Повний output попередньої відповіді разом із reasoning items та function call outputs переноситься в наступний request. Refusal, incomplete, HTTP/JSON/schema errors та перевищення context/time/response limits завершують запуск без публікації. Останній API round або досягнення tool quota дає фінальний прохід без tools із явним застереженням про межі source-перевірки; додатковий запит поза лімітами не робиться. Автоматичних повторів оплачуваного inference немає. У logs записуються лише суми input/output tokens, request/tool counts; raw responses та secrets не друкуються.

## Публікація й повторні findings

Publisher в окремому job перевіряє JSON, canonical path/side/line та актуальні base/head SHA. До п'яти P0/P1/P2 findings публікуються одним `COMMENT` review. За нуля нових findings оновлюється лише stable summary. Canonical GitHub files API визначає anchors; перейменований файл використовує новий filename навіть на LEFT. Відсутні patches і відкинуті anchors явно повідомляються у summary. Зміна HEAD/base під час аналізу скасовує публікацію.

Fingerprint нормалізованого path/title прибирає повтори unresolved bot threads навіть після зміщення рядків. Resolved дефект, який повернувся, можна повідомити знову. Модель також бачить попередні reviews, але перефразований дефект може потребувати ручного розпізнавання. Людські threads не закриваються; відсутність старого finding у новій відповіді не доводить виправлення. Review не підтверджує тести, browser behavior або Figma-відповідність.

Workflow/scripts/prompt беруться з trusted default branch SHA. Analysis job має лише read permissions, OpenAI key доступний тільки trusted Responses step, без GitHub token у цьому step. Окремий publisher має `pull-requests: write`, не завантажує PR Git objects і не виконує model output. Немає autofix, approval, request-changes або merge.

На один PR одночасно працює не більше одного analysis job й одного publisher. GitHub може замінити pending запит новішим. Між останньою SHA перевіркою та API POST лишається невелике вікно; review прив'язаний до `commit_id`. Якщо review опубліковано, а summary update не вдався, повторний запуск відкине наявні inline findings та відновить summary.

## Offline перевірка

На Node.js `24.22.1`:

```sh
node --test .github/codex/*.test.mjs
```

Fixtures використовують локальні Git objects і mock Responses/GitHub API. Вони не звертаються до OpenAI й не публікують comments. Окремий CI запускає ці перевірки для змін scripts/workflows. Реальні model access, credit balance, платний review та публікацію перевірятимуть окремо після setup; цією реалізацією live run не виконувався.
