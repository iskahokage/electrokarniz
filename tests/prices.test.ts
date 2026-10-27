// Прайс из таблицы: формат price-list-template.csv, пустая цена — null, «примечание» не попадает в снимок.
import { describe, expect, it } from "vitest";
import { parseCsv, toSnapshot } from "../scripts/prices.mjs";

const csv = `﻿id;категория;марка;название_ru;название_ky;единица;цена_сом;доплата_за_метр_сом;наличие;срок_под_заказ_дней;показывать_на_сайте;примечание
kit-novo-n21-wifi;Электрокарниз — комплект;Novo;Электрокарниз Novo N21 Wi-Fi;;первый метр;13000;3000;в наличии;15-20;да;"Монтаж включён; проверьте"
profile;Комплектующие;;Профиль;;м;1 200;;под заказ;10;;
remote;Пульт;;Пульт;;шт;;;в наличии;;да;себестоимость не пишем
`;

describe("прайс", () => {
  it("разбирает CSV с «;», кавычками и BOM", () => {
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(3);
    expect(rows[0].примечание).toBe("Монтаж включён; проверьте");
  });

  it("собирает снимок по slug каталога", () => {
    const { items, errors } = toSnapshot(parseCsv(csv)) as { items: Record<string, { price: number | null }>; errors: string[] };
    expect(errors).toEqual([]);
    expect(items["novo-n21-wifi"]).toEqual({ price: 13000, perMeter: 3000, stock: "in", leadDays: "15–20" });
    expect(items.profil).toMatchObject({ price: 1200, stock: "order" });
    expect(items.remote.price).toBeNull();
    expect(JSON.stringify(items)).not.toContain("себестоимость");
  });

  it("ловит нечисловую цену", () => {
    const { errors } = toSnapshot(parseCsv("id;цена_сом\nprofile;дорого\n"));
    expect(errors[0]).toContain("profile");
  });
});
