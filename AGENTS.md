# Правила frontend

Стилізуйте компоненти й сторінки виключно Tailwind utility classes у TSX, включно з responsive/state та arbitrary variants. Повторно використовуйте наявні UI-kit компоненти й semantic tokens.

Окремі component/page CSS, CSS Modules, Sass, CSS-in-JS, статичні inline styles і перенесення component selectors у global CSS заборонені. Наявні Tailwind entry, font-face, palette та theme-token файли залишаються інфраструктурою стилів. Новий custom CSS потребує явного погодження користувача. Успадкований `RegisterPage.css` не є зразком для нового коду.

Перед змінами UI-kit читайте [контракти компонентів](frontend/docs/ui-kit.md), перед змінами кольорів або тем [контракт тем](frontend/docs/themes.md), перед змінами workspace [контракт композиції та overflow](frontend/docs/workspace-contract.md).
