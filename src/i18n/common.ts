// Общие строки оболочки сайта. Строки страниц — в src/i18n/pages/<раздел>.ts.
import type { Locale } from ".";

export const nav = [
  { path: "/resheniya/", ru: "Решения", ky: "Чечимдер" },
  { path: "/katalog/", ru: "Каталог", ky: "Каталог" },
  { path: "/obekty/", ru: "Объекты", ky: "Объекттер" },
  { path: "/raschet/", ru: "Расчёт", ky: "Эсептөө" },
  { path: "/kontakty/", ru: "Контакты", ky: "Байланыш" },
] as const;

const ru = {
  brand: "Электрокарниз",
  menu: "Меню",
  close: "Закрыть",
  cart: "Корзина",
  writeWa: "Написать в WhatsApp",
  calc: "Рассчитать стоимость",
  call: "Позвонить",
  waHello: "Здравствуйте! Хочу узнать про электрокарниз.",
  bottom: { wa: "WhatsApp", calc: "Расчёт", catalog: "Каталог", label: "Быстрые действия" },
  crumbs: "Путь к странице",
  priceTbd: "Цена уточняется",
  inStock: "В наличии",
  onOrder: (days: string) => `Под заказ, ${days} дней`,
  toCart: "В корзину",
  inCart: "В корзине",
  more: "Подробнее",
  home: "Главная",
  skip: "К содержанию",
  footer: {
    tagline: "Электрокарнизы Dooya и Novo. Установка в Бишкеке за 1 день, доставка по Кыргызстану, в Казахстан и СНГ.",
    regions: "Устанавливаем: Бишкек, Чуйская область, Иссык-Куль, Ош",
    hours: "Работаем без выходных",
    sections: "Разделы",
    buyers: "Покупателям",
    contacts: "Контакты",
    links: [
      { path: "/dostavka-i-oplata/", label: "Доставка и оплата" },
      { path: "/garantiya/", label: "Гарантия" },
      { path: "/upravlenie/", label: "Управление и умный дом" },
      { path: "/usloviya/", label: "Условия заказа" },
      { path: "/privacy/", label: "Персональные данные" },
    ],
    legal: (name: string, license: string | null) => (license ? `${name}. Лицензия (патент) № ${license}` : name),
    demo: "Фото и часть данных на сайте — демонстрационные.",
  },
  lang: { ru: "Русский", ky: "Кыргызча" },
};

const ky: typeof ru = {
  brand: "Электрокарниз",
  menu: "Меню",
  close: "Жабуу",
  cart: "Себет",
  writeWa: "WhatsApp'ка жазуу",
  calc: "Баасын эсептөө",
  call: "Чалуу",
  waHello: "Саламатсызбы! Электрокарниз тууралуу билгим келет.",
  bottom: { wa: "WhatsApp", calc: "Эсептөө", catalog: "Каталог", label: "Тез аракеттер" },
  crumbs: "Баракка жол",
  priceTbd: "Баасы такталууда",
  inStock: "Кампада бар",
  onOrder: (days: string) => `Буйрутма менен, ${days} күн`,
  toCart: "Себетке",
  inCart: "Себетте",
  more: "Толугураак",
  home: "Башкы бет",
  skip: "Мазмунга өтүү",
  footer: {
    tagline: "Dooya жана Novo электрокарниздери. Бишкекте 1 күндө орнотобуз, Кыргызстан, Казакстан жана КМШ боюнча жеткирүү.",
    regions: "Орнотобуз: Бишкек, Чүй облусу, Ысык-Көл, Ош",
    hours: "Дем алышсыз иштейбиз",
    sections: "Бөлүмдөр",
    buyers: "Сатып алуучуларга",
    contacts: "Байланыш",
    links: [
      { path: "/dostavka-i-oplata/", label: "Жеткирүү жана төлөө" },
      { path: "/garantiya/", label: "Кепилдик" },
      { path: "/upravlenie/", label: "Башкаруу жана акылдуу үй" },
      { path: "/usloviya/", label: "Буйрутма шарттары" },
      { path: "/privacy/", label: "Жеке маалыматтар" },
    ],
    legal: (name: string, license: string | null) => (license ? `${name}. Лицензия (патент) № ${license}` : name),
    demo: "Сайттагы сүрөттөр жана маалыматтын бир бөлүгү — демонстрациялык.",
  },
  lang: { ru: "Русский", ky: "Кыргызча" },
};

export const common = { ru, ky };
export const t = (locale: Locale) => common[locale];
