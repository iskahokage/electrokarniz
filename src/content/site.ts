// Все факты о компании — только здесь. У конкурента часы в шапке и в меню разные; у нас так быть не может.
export const site = {
  name: "Электрокарниз",
  domain: "electrokarniz.kg",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://electrokarniz.kg",
  phone: "+996 771 425 492",
  phoneHref: "tel:+996771425492",
  whatsapp: "996771425492",
  email: "info@electrokarniz.kg",
  instagram: "https://www.instagram.com/elektrokarniz_kg/",
  instagramHandle: "@elektrokarniz_kg",
  legal: {
    // ВРЕМЕННО: ИП в процессе открытия (27.10.2026). Номер лицензии и название заменить, когда будут.
    name: "ИП «Электрокарниз»",
    license: "000000000",
    temporary: true,
  },
  facts: {
    years: 6,
    objects: 700,
    perMonth: 20,
    replyMinutes: 15,
    installDaysBishkek: 1,
    orderDays: "15–20",
    warrantyYears: 3,
    prepaymentPercent: 50,
  },
  installRegions: {
    ru: ["Бишкек", "Чуйская область", "Иссык-Куль", "Ош"],
    ky: ["Бишкек", "Чүй облусу", "Ысык-Көл", "Ош"],
  },
} as const;
