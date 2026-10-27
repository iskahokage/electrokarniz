// Приём заказов с сайта electrokarniz.kg.
// Сайт шлёт POST с Content-Type text/plain (JSON в теле) — так браузер не делает preflight,
// на который Apps Script ответить не умеет. Скрипт проверяет данные, пишет строку в лист «Заказы»,
// присылает письмо владельцу и возвращает номер заказа: {ok: true, number: "EK-1001"}.
// Как подключить — docs/owner-orders-setup.md.

var SHEET_NAME = "Заказы";
var OWNER_EMAIL = "info@electrokarniz.kg";
var TIMEZONE = "Asia/Bishkek";
var FIRST_NUMBER = 1001;
var MAX_PER_PHONE = 3; // заказов с одного номера за 10 минут — дальше считаем повтором или ботом
var THROTTLE_SECONDS = 600;
var MIN_FILL_MS = 2000;

var HEADERS = [
  "Дата", "Номер", "Тип", "Имя", "Телефон", "Способ получения", "Город", "Адрес",
  "Позиции", "Итого, сом", "Есть цены по запросу", "Оплата", "Комментарий", "Язык", "Страница",
  "utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "Referrer", "Первая страница",
];

var METHODS = {
  "install-bishkek": "Установка в Бишкеке",
  "install-region": "Установка за городом",
  "delivery-kg": "Доставка по Кыргызстану",
  "delivery-cis": "Доставка в Казахстан и СНГ",
};
var PAYMENTS = { cash: "Наличные", transfer: "Перевод", qr: "QR", invoice: "Безнал" };

function doPost(e) {
  var body;
  try {
    body = JSON.parse((e && e.postData && e.postData.contents) || "{}");
  } catch (err) {
    return json({ ok: false, error: "bad_json" });
  }
  // JSON.parse("null") и массивы проходят parse — отсекаем, иначе body.hp упадёт с ошибкой.
  if (!body || typeof body !== "object" || Array.isArray(body)) return json({ ok: false, error: "bad_json" });

  // Ловушка для ботов заполнена — отвечаем «успехом», ничего не пишем.
  if (body.hp) return json({ ok: true, number: "EK-0" });
  // NaN (поле не пришло) тоже считаем «слишком быстро»: сравнение с NaN всегда false.
  var elapsed = Number(body.elapsedMs);
  if (!(elapsed >= MIN_FILL_MS)) return json({ ok: false, error: "too_fast" });

  var error = validate(body);
  if (error) return json({ ok: false, error: error });

  // Простой лимит повторов по телефону.
  var cache = CacheService.getScriptCache();
  var key = "ph:" + String(body.phone).replace(/\D/g, "");
  var hits = Number(cache.get(key) || 0);
  if (hits >= MAX_PER_PHONE) return json({ ok: false, error: "too_many" });
  cache.put(key, String(hits + 1), THROTTLE_SECONDS);

  var number;
  var lock = LockService.getScriptLock();
  lock.waitLock(15000);
  try {
    var sheet = getSheet();
    number = nextNumber();
    sheet.appendRow(toRow(body, number));
  } finally {
    lock.releaseLock();
  }

  // Письмо — вторая копия. Если почта не ушла, заказ уже в таблице, клиенту отвечаем успехом.
  try {
    MailApp.sendEmail({
      to: OWNER_EMAIL,
      subject: "Заказ " + number + " с сайта — " + txt(body.name) + ", " + txt(body.phone),
      body: emailText(body, number),
    });
  } catch (err) {
    console.error("mail failed", err);
  }

  return json({ ok: true, number: number });
}

// Открыть адрес скрипта в браузере — быстрая проверка, что он развернут.
function doGet() {
  return json({ ok: true, service: "electrokarniz orders" });
}

function validate(b) {
  if (b.type !== "order" && b.type !== "lead") return "type";
  var name = String(b.name || "").trim();
  if (name.length < 1 || name.length > 80) return "name";
  var phone = String(b.phone || "");
  var digits = phone.replace(/\D/g, "");
  if (phone.charAt(0) !== "+" || digits.length < 8 || digits.length > 15) return "phone";
  if (digits.indexOf("996") === 0 && digits.length !== 12) return "phone";
  if (digits.charAt(0) === "7" && digits.length !== 11) return "phone";
  if (b.type === "order") {
    if (!Array.isArray(b.items) || b.items.length < 1 || b.items.length > 50) return "items";
    for (var i = 0; i < b.items.length; i++) {
      var it = b.items[i];
      if (!it || !it.title || !(Number(it.qty) >= 1 && Number(it.qty) <= 999)) return "items";
    }
    if (!METHODS[b.method]) return "method";
  }
  if (String(b.address || "").length > 300 || String(b.comment || "").length > 1000 || String(b.city || "").length > 120) return "length";
  return "";
}

function getSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  var sheet = ss.getSheetByName(SHEET_NAME) || ss.insertSheet(SHEET_NAME);
  if (sheet.getLastRow() === 0) {
    sheet.appendRow(HEADERS);
    sheet.setFrozenRows(1);
    sheet.getRange(1, 1, 1, HEADERS.length).setFontWeight("bold");
  }
  return sheet;
}

function nextNumber() {
  var props = PropertiesService.getScriptProperties();
  var n = Number(props.getProperty("lastNumber") || FIRST_NUMBER - 1) + 1;
  props.setProperty("lastNumber", String(n));
  return "EK-" + n;
}

function itemsText(items) {
  return (items || [])
    .map(function (it, i) {
      var price = it.lineTotal == null ? "цена по запросу" : it.lineTotal + " сом";
      return i + 1 + ". " + it.title + (it.config ? " (" + it.config + ")" : "") + " × " + it.qty + (it.unit === "m" ? " м" : "") + " — " + price;
    })
    .join("\n");
}

function toRow(b, number) {
  var utm = b.utm || {};
  return [
    Utilities.formatDate(new Date(), TIMEZONE, "yyyy-MM-dd HH:mm"),
    number,
    b.type === "lead" ? "Заявка" : "Заказ",
    clean(b.name),
    clean(b.phone),
    METHODS[b.method] || "",
    clean(b.city),
    clean(b.address),
    clean(itemsText(b.items)),
    Number(b.total) || 0,
    b.hasUnknown ? "да" : "",
    PAYMENTS[b.payment] || "",
    clean(b.comment),
    b.locale === "ky" ? "кыргызский" : "русский",
    clean(b.page),
    clean(utm.utm_source),
    clean(utm.utm_medium),
    clean(utm.utm_campaign),
    clean(utm.utm_content),
    clean(utm.utm_term),
    clean(b.referrer),
    clean(utm.landing), // с какой страницы начался визит — пишет analytics.tsx вместе с UTM
  ];
}

function emailText(b, number) {
  return [
    "Заказ " + number,
    "",
    "Имя: " + txt(b.name),
    "Телефон: " + txt(b.phone) + "  (WhatsApp: https://wa.me/" + String(b.phone).replace(/\D/g, "") + ")",
    "Получение: " + (METHODS[b.method] || "") + (b.city ? ", " + txt(b.city) : ""),
    b.address ? "Адрес: " + txt(b.address) : "",
    b.payment ? "Оплата: " + (PAYMENTS[b.payment] || "") : "",
    "",
    itemsText(b.items),
    "",
    "Итого: " + (Number(b.total) || 0) + " сом" + (b.hasUnknown ? " + позиции с ценой по запросу" : ""),
    b.comment ? "\nКомментарий: " + txt(b.comment) : "",
    "",
    "Страница: " + txt(b.page) + ", язык: " + (b.locale === "ky" ? "кыргызский" : "русский"),
  ]
    .join("\n");
}

// Текст из формы не должен стать формулой в таблице: «=…», «+…», «-…», «@…» экранируем апострофом.
function clean(v) {
  var s = String(v == null ? "" : v).slice(0, 1000);
  return /^[=+\-@]/.test(s) ? "'" + s : s;
}

// Для письма — как есть, без апострофа.
function txt(v) {
  return String(v == null ? "" : v).slice(0, 1000);
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
