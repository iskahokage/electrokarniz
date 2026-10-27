# SEO и аналитика

## Что сделано

**Индексация**
- `NEXT_PUBLIC_SITE_ENV=staging` (по умолчанию): `robots.txt` — `Disallow: /`, на всех страницах `noindex` (src/lib/seo.ts). Так демо-фото и временные данные не попадут в Google и Яндекс.
- `NEXT_PUBLIC_SITE_ENV=production`: `robots.txt` разрешает обход (кроме корзины и оформления) и указывает `sitemap.xml`; страницы `index, follow`.
- `sitemap.xml` (src/app/sitemap.ts) собирается при сборке: все страницы на русском и кыргызском, включая каждый товар, тип решения, марку и объект. У каждого адреса — hreflang `ru`, `ky`, `x-default`. Новые товары и объекты попадают в sitemap сами.
- У каждой страницы canonical на основной домен и hreflang (src/lib/seo.ts, `buildMeta`).
- Корзина и оформление — `noindex` и в production (личные страницы).
- Кыргызская версия попадает в поиск только с `NEXT_PUBLIC_KY_ENABLED=1`: до проверки текстов страницы `/ky/` в production работают, но `noindex`, без hreflang `ky` и вне `sitemap.xml`.
- Заголовок вкладки (`src/lib/seo.ts`, pageTitle): «<название страницы> — Электрокарниз». Если название уже содержит «Электрокарниз» или вместе с хвостом длиннее 65 знаков (Google обрежет) — без хвоста. Если в названии уже есть своё тире, хвост пишется через «·» («Спальня в Асанбае — объект · Электрокарниз»), чтобы не было цепочки из тире.

**Структурированные данные (JSON-LD)**
- На каждой странице — `HomeAndConstructionBusiness` (название, сайт, телефон, почта, Instagram, регионы установки: Бишкек, Чуйская область, Иссык-Куль, Ош). Адреса нет: шоурума пока нет. Когда появится — добавить `address` и `geo` в `businessLd` (src/lib/jsonld.ts).
- Готовы помощники `productLd(product, locale, priceFrom)` и `serviceLd(solution, locale)` в src/lib/jsonld.ts. `Offer` выводится только с настоящей ценой в KGS: пока цен нет, Google увидит товар без цены — это честно и не нарушает правила.
- Хлебные крошки (`BreadcrumbList`) выводит `<PageHead>` на каждой внутренней странице.

**Значки и превью для соцсетей**
- `src/app/icon.svg` — знак из логотипа (рельс с зелёным бегунком и штора), `src/app/apple-icon.png` — для iPhone.
- `public/og/default.png` и `public/og/default-ky.png` (1200×630) — картинка при отправке ссылки в WhatsApp, Telegram, Instagram, Facebook; у кыргызских страниц — кыргызский текст (черновик, проверьте «1 күндө орнотуу · 3 жылдык кепилдик»).
- Пересоздать после смены логотипа: `node scripts/og.mjs`.

**Аналитика** (src/components/shell/analytics.tsx)
- GA4, Meta Pixel и Яндекс Метрика включаются только в production и только если задан их ID в env. Скрипты грузятся после первого касания, прокрутки или через 4 секунды — скорость первого экрана не страдает.
- События сайта и что получает каждая система:

| Событие сайта | GA4 | Meta Pixel | Метрика (цель) |
|---|---|---|---|
| view_item — открыт товар | view_item | ViewContent | view_item |
| add_to_cart — добавлено в корзину | add_to_cart | AddToCart | add_to_cart |
| begin_checkout — начато оформление | begin_checkout | InitiateCheckout | begin_checkout |
| order_submit — заказ отправлен | generate_lead (value, KGS) | Lead (value, KGS) | order_submit |
| whatsapp_click — нажата ссылка WhatsApp | whatsapp_click | Contact | whatsapp_click |
| call_click — нажат телефон | call_click | Contact | call_click |
| calculator_start / calculator_complete, order_error | то же имя | своё событие | то же имя |

- Клики по любой ссылке WhatsApp (`https://wa.me/…`) и телефона (`tel:`) считаются автоматически — ничего добавлять в кнопки не нужно. Если кнопка сама вызывает `track("whatsapp_click", …)`, событие уходит одно, с параметрами обоих.
- UTM-метки и рекламные метки (`gclid`, `fbclid`, `yclid`) первой страницы визита сохраняются (sessionStorage `ek-utm`) и уходят вместе с заказом — видно, с какой рекламы пришёл клиент.

## Что сделать владельцу

1. **Google Search Console** — https://search.google.com/search-console: добавить ресурс «Домен» `electrokarniz.kg`, подтвердить TXT-записью в DNS (в панели hoster.kg). После запуска отправить `https://electrokarniz.kg/sitemap.xml`.
2. **Яндекс Вебмастер** — https://webmaster.yandex.ru: то же самое (подтверждение DNS или мета-тегом — пришлите код, добавим), отправить sitemap. Яндексом в Кыргызстане пользуются заметно.
3. **Google Бизнес-профиль** — https://business.google.com: тип «компания, которая выезжает к клиентам» (адрес скрыт, указать районы обслуживания: Бишкек, Чуйская обл., Иссык-Куль, Ош). Название, телефон и сайт — точно как на сайте. Добавить 10+ реальных фото работ, просить клиентов оставлять отзывы.
4. **2ГИС** — https://account.2gis.com: создать карточку организации без адреса (или с адресом склада, если готовы принимать по нему), те же телефон, сайт, Instagram. В Бишкеке 2ГИС — главный справочник.
5. **Счётчики**: создать GA4 (идентификатор `G-…`), Meta Pixel (в Meta Business Suite), Яндекс Метрику — прислать три ID, мы впишем их в настройки хостинга (`NEXT_PUBLIC_GA_ID`, `NEXT_PUBLIC_META_PIXEL_ID`, `NEXT_PUBLIC_YM_ID`).
6. **Домен elektrokarniz.kg** (через «k») — купить как запасной: люди пишут название по-разному. Настроить постоянную переадресацию 301 на `https://electrokarniz.kg` (в DNS/хостинге; в статическом сайте это не делается). В Search Console основной адрес — только electrokarniz.kg.
7. **Перед запуском**: поставить `NEXT_PUBLIC_SITE_ENV=production` и пересобрать. Пока на сайте демо-фото и временные данные ИП — лучше оставить staging.
8. **Кыргызская версия**: проверить тексты (вы носитель языка), затем поставить `NEXT_PUBLIC_KY_ENABLED=1` и пересобрать — после этого она пойдёт в поиск.
