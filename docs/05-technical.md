# 05 · Техническая архитектура

## Стек

- Next.js 16.4 (App Router), React 19.3, TypeScript strict.
- Tailwind CSS v4: токены в `@theme`.
- Headless UI v2, `clsx` + `tailwind-merge` (`cn()`), lucide-react, zod.
- sharp — медиа-пайплайн.

## Сборка: статическая (`output: 'export'`)

Хостинг владельца — «другой», не Vercel (У18), поэтому сайт не зависит от сервера:

- **Страницы** рендерятся при сборке. Динамические маршруты — через `generateStaticParams`.
- **Корзина** хранится в `localStorage`.
- **Заказы** уходят POST-запросом в Google Apps Script (`NEXT_PUBLIC_ORDER_ENDPOINT`), `Content-Type: text/plain`, чтобы не было preflight. Скрипт пишет строку в Google-таблицу «Заказы» и отправляет письмо.
- **Цены** берутся из опубликованной Google-таблицы (`PRICES_CSV_URL`) при сборке: проверка zod, снимок в `data/prices.snapshot.json`. Если таблица недоступна — используется последний снимок.
- **Картинки**: next/image без серверной оптимизации. Скрипт `scripts/media.mjs` (sharp) готовит AVIF и WebP шириной 640, 1080 и 1600 px, компонент `<Picture>` выводит `srcset`.
- **Редиректы доменов** (elektrokarniz.kg → electrokarniz.kg) настраиваются на хостинге или в DNS.

В статической сборке не работают: Route Handlers с Request, `redirects` и `headers` в next.config, ISR, Proxy (бывший middleware), стандартный loader next/image.

## Языки

- Русская версия — без префикса, кыргызская — `/ky/…`, slug-и одинаковые.
- Обёртки страниц генерирует `scripts/routes.mjs` (перед `dev` и `build`) из одного реестра: страница = `src/views/<view>.tsx`.
- Строки интерфейса — `src/i18n/common.ts` и `src/i18n/pages/*.ts` (ru и ky рядом, тип ky = тип ru, пропуск строки — ошибка TypeScript). Контент — поля `{ ru, ky }`.
- Кыргызский — наш черновик (У19 без ответа). В production без `NEXT_PUBLIC_KY_ENABLED=1` страницы /ky/ работают, но `noindex`, без hreflang ky и вне sitemap. После проверки носителем — поставить `1` и пересобрать.
- Шрифты с subset `cyrillic-ext`, чтобы были ң, ө, ү.

## Данные

```
src/content/  site.ts       факты о компании (телефон, почта, ИП, регионы, цифры доверия)
              catalog.ts    все товары одним файлом: модели, характеристики с source, фото, цены по умолчанию
              solutions.ts  типы решений; solution-images.ts — фото к ним
              brands.ts     Dooya и Novo
              projects.ts   объекты (сейчас 8 демо, demo: true)
              faq.ts        частые вопросы
src/lib/      pricing.ts cart.ts cart-sync.ts order.ts order-message.ts phone.ts whatsapp.ts track.ts seo.ts jsonld.ts
data/         prices.snapshot.json   последний удачный прайс из Google-таблицы
scripts/      routes.mjs prices.mjs media.mjs og.mjs perf-compare.mjs
apps-script/  orders.gs   приём заказов (Google Apps Script)
```

Отзывов в данных нет: реальные отзывы владелец пришлёт позже, выдуманные не публикуем.
Себестоимость и остатки со склада в репозиторий не попадают.

### Как цены попадают на сайт

1. `scripts/prices.mjs` (запускается сам перед `npm run build` и `npm run dev`) скачивает `PRICES_CSV_URL` — таблицу в формате `price-list-template.csv`.
2. Проверка zod: цена — число или пусто. Ошибка в строке или недоступная таблица → сборка идёт на прошлом снимке `data/prices.snapshot.json` и пишет предупреждение `prices: ВНИМАНИЕ…`.
3. Строки сопоставляются с товарами по `id` (короткие id шаблона переводятся в slug каталога — таблица `ALIASES` в скрипте).
4. `src/content/catalog.ts` накладывает снимок на каталог: у комплекта — база и цена метра, у штучного товара — цена, наличие и срок. Пустая цена — на сайте знак сома и «уточним в WhatsApp».
5. Колонка «примечание» в снимок не попадает.

Без `PRICES_CSV_URL` работают цены из `catalog.ts`: комплекты по формуле 12 000 + 3 000 за метр, остальное — знак сома.

### Демо-данные

Объекты с `demo: true` в production-сборке (`NEXT_PUBLIC_SITE_ENV=production`) скрыты: страница «Объекты» показывает фразу «скоро появятся», на главной блока нет, в sitemap их нет. Проверяет тест `tests/demo-gate.test.ts`. Временно показать их в production можно флагом `NEXT_PUBLIC_SHOW_DEMO=1` — только по решению владельца.
Фото товаров с пометкой «demo» остаются: это фото моделей из открытых источников.

## Формула цены (`src/lib/pricing.ts`)

```
цена ряда = база мотора (12 000) + (длина − 1 м) × 3 000   // по фактической длине (У1, У2)
два ряда  = два отдельных карниза                         // У3, без скидки за второй ряд
итог      ≥ 12 000; длина 1–12 м, больше 12 м — расчёт в WhatsApp
скидка    = 10 % от всей суммы заказа, если карнизов ≥ 4   // окна × ряды; DISCOUNT в pricing.ts
выезд     = Чуйская обл. от 1 000, Иссык-Куль 10 000, Ош 15 000 — отдельно, в итог не входит
```

Рядом с итогом подпись: «итог может отличаться на 3–5 тыс. сом после замера».
Проверочный пример: 3 м → 18 000 сом; 4 окна по 3 м → 72 000 − 7 200 = 64 800 сом.
Сумма, скидка и итог корзины считаются в одном месте — `src/lib/cart-totals.ts`.

Корзина хранит цену на момент добавления (`localStorage`, ключ `ek-cart-v1`), но при открытии корзины и оформления сверяется с каталогом (`src/lib/cart-sync.ts`): цена пересчитывается, пропавший товар помечается «больше нет в каталоге».

## Окружение

```
NEXT_PUBLIC_SITE_ENV=staging|production   staging — noindex и без счётчиков
NEXT_PUBLIC_SITE_URL=https://electrokarniz.kg
NEXT_PUBLIC_ORDER_ENDPOINT=               адрес веб-приложения Apps Script
PRICES_CSV_URL=                           опубликованная таблица цен (CSV)
NEXT_PUBLIC_KY_ENABLED=                   1 — кыргызская версия в поиске
NEXT_PUBLIC_SHOW_DEMO=                    1 — показать демо-объекты в production (не по умолчанию)
NEXT_PUBLIC_GA_ID=
NEXT_PUBLIC_META_PIXEL_ID=
NEXT_PUBLIC_YM_ID=
```

## SEO

- Metadata, canonical и hreflang для обоих языков. `sitemap.xml` и `robots.txt` генерируются при сборке.
- На staging — `noindex`, `Disallow: /`.
- JSON-LD: одна организация `HomeAndConstructionBusiness` (@id `#business`) без адреса на всех страницах; `Product` + `Offer` в KGS — только у товаров с реальной ценой; `Service` у решений; `BreadcrumbList` на внутренних страницах.

## Проверки

```
npx tsc --noEmit      типы
npx eslint src        линтер
npx vitest run        unit-тесты: цена, телефон, калькулятор, сообщение заказа, отправка, прайс, сверка корзины, демо
npm run build         статическая сборка в out/
```

## Для владельца — простыми словами

### Обновить цены

1. Откройте Google-таблицу цен и поменяйте цифру. Пустая клетка = «цена уточняется».
2. Пересоберите сайт: `npm run build` (или кнопка «Deploy» у хостинга, если сборка настроена там).
3. В конце сборки смотрите строку `prices:` — там видно, сколько позиций загружено, или предупреждение, если таблица не открылась.

### Добавить объект

1. Положите фото в `content-inbox/` и выполните `npm run media` — появятся файлы в `public/media/`.
2. Добавьте запись в `src/content/projects.ts`: название, район, длина, модель (slug из каталога), монтаж, открытие, управление, фото. Не ставьте `demo: true` — объект настоящий.
3. Пересоберите сайт.

### Выложить сайт на хостинг

1. Задайте переменные окружения (см. выше), для боевого сайта `NEXT_PUBLIC_SITE_ENV=production`.
2. `npm ci && npm run build` — готовый сайт в папке `out/`.
3. Загрузите содержимое `out/` в корень сайта на хостинге (FTP или панель). Сервер должен отдавать `404.html` на несуществующие адреса — на cPanel это `ErrorDocument 404 /404.html` в `.htaccess`.
4. Включите HTTPS (Let's Encrypt в панели хостинга).
5. Домен elektrokarniz.kg (после покупки) — постоянный редирект 301 на https://electrokarniz.kg с сохранением пути: в панели «Редиректы» или в `.htaccess` второго домена `RewriteRule ^(.*)$ https://electrokarniz.kg/$1 [R=301,L]`.

### Скрипт заказов

Пошагово — в `docs/owner-orders-setup.md`.
