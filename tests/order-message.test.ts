// Текст заказа для WhatsApp: номер, позиции и итог обязательно в сообщении.
import { describe, expect, it } from "vitest";
import { buildCalcMessage, buildOrderMessage, cartTotals, configSummary } from "../src/lib/order-message";
import { formatMeters, formatNumber } from "../src/lib/format";
import type { CartItem } from "../src/lib/cart";

const kit: CartItem = {
  id: "novo|3.2",
  slug: "novo-n21-wifi",
  kind: "kit",
  title: { ru: "Электрокарниз Novo N21 Wi-Fi", ky: "Novo N21 Wi-Fi электрокарнизи" },
  qty: 2,
  unitPrice: 19600,
  config: { length: 3.2, opening: "center", mount: "ceiling", control: "alice", rows: 1, region: "bishkek" },
};
const remote: CartItem = { id: "pult", slug: "pult", kind: "item", title: { ru: "Пульт", ky: "Пульт" }, qty: 1, unitPrice: null };

describe("buildOrderMessage", () => {
  it("содержит номер, позиции и итог", () => {
    const text = buildOrderMessage({ locale: "ru", number: "EK-0042", items: [kit, remote], method: "install-bishkek", name: "Айгерим" });
    expect(text).toContain("EK-0042");
    expect(text).toContain("Электрокарниз Novo N21 Wi-Fi");
    expect(text).toContain(formatMeters(3.2));
    expect(text).toContain("Алиса");
    expect(text).toContain(`${formatNumber(39200)} сом`);
    expect(text).toContain("цена по запросу");
    expect(text).toContain("Установка в Бишкеке");
  });
  it("по-кыргызски — тоже с номером и итогом", () => {
    const text = buildOrderMessage({ locale: "ky", number: "EK-7", items: [kit] });
    expect(text).toContain("EK-7");
    expect(text).toContain(`${formatNumber(39200)} сом`);
  });
  it("без номера (сбой отправки) сообщение всё равно собирается", () => {
    const text = buildOrderMessage({ locale: "ru", items: [kit] });
    expect(text).toContain("Заказ с сайта");
    expect(text).toContain(formatNumber(39200));
  });
  it("остаётся коротким для ссылки wa.me", () => {
    const text = buildOrderMessage({ locale: "ru", number: "EK-1", items: [kit, remote, kit, remote], method: "delivery-cis", city: "Алматы" });
    expect(encodeURIComponent(text).length).toBeLessThan(2000);
  });
});

describe("cartTotals", () => {
  it("складывает известные цены и отмечает неизвестные", () => {
    expect(cartTotals([kit, remote])).toEqual({ subtotal: 39200, discount: 0, total: 39200, cornices: 2, hasUnknown: true });
  });
  it("от 4 карнизов — скидка 10 % на весь заказ, включая штучные товары", () => {
    const priced: CartItem = { ...remote, unitPrice: 2000 };
    const t = cartTotals([{ ...kit, qty: 4 }, priced]);
    expect(t.cornices).toBe(4);
    expect(t.subtotal).toBe(78400 + 2000);
    expect(t.discount).toBe(8040);
    expect(t.total).toBe(80400 - 8040);
  });
  it("двухрядный карниз считается как два", () => {
    const twoRows: CartItem = { ...kit, config: { ...kit.config!, rows: 2 } };
    expect(cartTotals([twoRows]).cornices).toBe(4);
    expect(cartTotals([{ ...twoRows, qty: 1 }]).discount).toBe(0);
  });
  it("3 карниза — без скидки", () => {
    expect(cartTotals([{ ...kit, qty: 3 }]).discount).toBe(0);
  });
  it("сообщение показывает сумму, скидку и итог", () => {
    const text = buildOrderMessage({ locale: "ru", number: "EK-9", items: [{ ...kit, qty: 4 }] });
    expect(text).toContain("Скидка 10");
    expect(text).toContain(`−${formatNumber(7840)} сом`);
    expect(text).toContain(`${formatNumber(70560)} сом`);
  });
});

describe("configSummary и buildCalcMessage", () => {
  it("сводка параметров", () => {
    expect(configSummary(kit.config!, "ru")).toBe(`${formatMeters(3.2)}, от центра, потолок, 1 ряд, Алиса, Бишкек`);
  });
  it("расчёт с ценой", () => {
    const text = buildCalcMessage({ locale: "ru", typeLabel: "Раздвижной электрокарниз", config: kit.config, model: "Novo N21 Wi-Fi", windows: 1, price: 19600 });
    expect(text).toContain(`${formatNumber(19600)} сом`);
    expect(text).toContain("Novo N21 Wi-Fi");
  });
  it("расчёт со скидкой показывает её отдельной строкой", () => {
    const text = buildCalcMessage({ locale: "ru", typeLabel: "Раздвижной электрокарниз", config: kit.config, windows: 4, price: 70560, discount: 7840 });
    expect(text).toContain(`−${formatNumber(7840)} сом`);
    expect(text).toContain(`${formatNumber(70560)} сом`);
  });
  it("больше 12 м — без цены, с просьбой посчитать", () => {
    const text = buildCalcMessage({ locale: "ru", typeLabel: "Раздвижной электрокарниз", windows: 1, price: 46000, over: true });
    expect(text).toContain("больше 12 м");
    expect(text).not.toContain("46");
  });
  it("больше 12 м — введённая длина в тексте, модели нет", () => {
    const text = buildCalcMessage({ locale: "ru", typeLabel: "Раздвижной электрокарниз", config: { ...kit.config!, length: 14 }, windows: 1, price: null, over: true });
    expect(text).toContain(formatMeters(14));
    expect(text).not.toContain("Novo");
  });
  it("тип по расчёту — ширина и управление в той же строке, до ссылки", () => {
    const text = buildCalcMessage({ locale: "ru", typeLabel: "Рулонные шторы", details: ["ширина окна 1,6 м", "пульт", "Бишкек"], windows: 2, price: null, url: "https://x/raschet/?type=roller" });
    const lines = text.split("\n");
    expect(lines[1]).toBe("Рулонные шторы, ширина окна 1,6 м, пульт, Бишкек, окон: 2");
    expect(lines.at(-1)).toContain("https://x/raschet/");
  });
});
