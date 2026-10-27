import type { L } from "@/i18n";
import type { BrandId } from "./types";

export type Brand = {
  id: BrandId;
  name: string;
  country: L;
  about: L;
  ownerWords: L; // слова владельца — их можно публиковать
  site: string;
  logo?: string; // имя из media manifest, если найден официальный логотип
  /** Короткие проверяемые факты о марке — каждый со ссылкой на источник. */
  facts?: { text: L; source: string }[];
};

// Описание марок — только то, что подтверждают источники (docs/sources.md).
// Логотипы не кладём: официальный растровый логотип Dooya 224×50 px — мал для сайта, у Novo его нет вовсе;
// название марки набираем шрифтом сайта. Владелец может прислать логотипы от поставщика.
export const brands: Record<BrandId, Brand> = {
  dooya: {
    id: "dooya",
    name: "Dooya",
    country: { ru: "Китай", ky: "Кытай" },
    about: {
      ru: "Производитель моторов для штор и солнцезащитных систем из Нинбо.",
      ky: "Нинбодогу пардалар жана күндөн коргоочу системалар үчүн моторлорду өндүрүүчү.",
    },
    ownerWords: { ru: "Dooya — для больших размеров.", ky: "Dooya — чоң өлчөмдөр үчүн." },
    site: "https://www.dooya.com",
    facts: [
      {
        text: {
          ru: "Компания Ningbo Dooya Mechanic & Electronic Technology, город Нинбо.",
          ky: "Ningbo Dooya Mechanic & Electronic Technology компаниясы, Нинбо шаары.",
        },
        source: "https://www.dooya.com",
      },
      {
        text: {
          ru: "Моторы серии DT82 по паспорту тянут шторы до 50 кг на шине до 12 м.",
          ky: "DT82 сериясындагы моторлор паспорт боюнча 12 м чейинки шинада 50 кг чейинки пардаларды тартат.",
        },
        source: "https://www.dooya.com/images/upload/Image/mcdj/khl/dt82te.png",
      },
      {
        text: {
          ru: "Wi-Fi-мотор DT82TV/SWM сертифицирован по стандарту умного дома Matter 1.1.",
          ky: "DT82TV/SWM Wi-Fi мотору Matter 1.1 акылдуу үй стандарты боюнча тастыкталган.",
        },
        source: "https://www.matteralpha.com/dooya/wi-fi-curtain-p1480",
      },
    ],
  },
  novo: {
    id: "novo",
    name: "Novo",
    country: { ru: "Китай", ky: "Кытай" },
    about: {
      ru: "Моторы для штор с пультом, Wi-Fi и управлением голосом.",
      ky: "Пульт, Wi-Fi жана үн менен башкарылуучу парда моторлору.",
    },
    ownerWords: { ru: "Novo — многофункциональный. Предлагаем по умолчанию.", ky: "Novo — көп функциялуу. Демейки сунушубуз." },
    // Сайта производителя не нашли; novo.kz — дистрибьютор в Казахстане, ссылку на него не ставим.
    site: "",
    facts: [
      {
        text: {
          ru: "Моторы серий N21 и N99 работают с приложением Tuya и Яндекс Алисой.",
          ky: "N21 жана N99 сериясындагы моторлор Tuya тиркемеси жана Яндекс Алиса менен иштейт.",
        },
        source: "https://novo.kz/p130106635-motor-dlya-elektrokarnizov.html",
      },
      {
        text: {
          ru: "Мотор N99 Mini — бесщёточный, размером 47 × 65 × 80 мм, шум до 20 дБ.",
          ky: "N99 Mini мотору — щеткасыз, өлчөмү 47 × 65 × 80 мм, үнү 20 дБ чейин.",
        },
        source: "https://novo.kz/p130079667-elektrodvigatel-dlya-shtor.html",
      },
    ],
  },
};
