# 04 · Дизайн-система

Источник правды — `src/app/globals.css` (Tailwind v4, `@theme`). Здесь — кратко, что где.

## Цвета

| Токен | Значение | Где |
|---|---|---|
| `paper` / `paper-2` / `paper-3` | `#f5f2ec` / `#ebe6dd` / `#e1dbd0` | фон, подложки фото и полей, hover |
| `ink` / `ink-2` / `ink-3` | `#171512` / `#5f5b55` / `#8a857d` | текст, второстепенный текст, подписи |
| `line` | `#d9d2c6` | линии 1 px |
| `accent` / `accent-2` | `#2d5a43` / `#234836` | главная кнопка (WhatsApp), активные состояния, фокус |
| `fabric` | `#ece6da` | ткань штор в анимации |
| `error` | `#a3321f` | ошибки форм, предупреждения корзины |

Фокус — обводка 2 px цвета `accent` (`:focus-visible`).

## Шрифты

- **Inter Tight** — всё, кроме данных. Регистр — как в предложении.
- **IBM Plex Mono** — только подписи-данные: метры, модели, сроки, наличие (`t-data`).
- Оба с `cyrillic-ext` (ң, ө, ү), `display: swap`.

## Типографика

| Класс | Размер | Назначение |
|---|---|---|
| `t-display` | 2,6–7,25 rem | заголовок первого экрана |
| `t-h1` | 2,25–4,5 rem | h1 внутренних страниц |
| `t-h2` | 1,9–3,75 rem | заголовки разделов |
| `t-h3` | 1,25–1,6 rem | заголовки карточек и блоков |
| `t-lead` | 1,06–1,25 rem | лид под заголовком |
| `t-data` | 0,81 rem, моно | данные |

Заголовки — `text-wrap: balance`, лид — `pretty`. Текст не меньше 12 px (кроме значка «demo» на фото). Поля ввода — 16 px и больше (иначе iOS увеличивает страницу).

## Кнопки

- `btn` — прямоугольная, высота от 52 px, отступы 24 px.
- `btn-accent` — главное действие, одна на экран.
- `btn-ink` — сильное второстепенное.
- `btn-line` — контурная, для остальных действий.
- Все нажимаемые элементы — от 44×44 px, включая ссылки в тексте и крошки.

## Компоненты

| Компонент | Файл | Что делает |
|---|---|---|
| `Header`, `Footer`, `BottomBar` | `src/components/shell/` | шапка с меню-шторкой, подвал, нижняя панель на телефоне (одна на экран) |
| `PageHead` | `src/components/page-head.tsx` | крошки + h1 + лид, JSON-LD BreadcrumbList |
| `SectionHead` | `src/components/section-head.tsx` | заголовок раздела с линией и ссылкой |
| `Picture` | `src/components/picture.tsx` | AVIF/WebP srcset из `public/media/manifest.json`, пометка «demo» |
| `Price` | `src/components/price.tsx` | цена или знак сома, «от …» / «…дон» |
| `ProductCard` | `src/components/product-card.tsx` | карточка товара: комплект — «Выбрать длину», штучный — «В корзину» |
| `ProjectFigure` | `src/components/info/project-figure.tsx` | объект в галерее; `aspect` — общая пропорция ряда |
| `WindowScheme` | `src/components/window-scheme.tsx` | чертёж окна в калькуляторе |
| `RemoteCurtains`, `Reveal` | `src/components/curtain/` | шторы с пультом, раскрытие фото |
| `MotorCompare` | `src/components/solutions/motor-compare.tsx` | таблица Novo и Dooya; пустая клетка — «уточним» |
| `Calculator`, `CartView`, `CheckoutForm` | `src/components/order/` | расчёт, корзина, оформление |

## Движение

`--ease-out-soft` для интерфейса, `--ease-motor` для штор (разгон и торможение, как у мотора). Все анимации отключаются при `prefers-reduced-motion: reduce`.
