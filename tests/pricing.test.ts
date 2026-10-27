// Формула владельца: 12 000 сом первый метр + 3 000 сом за каждый следующий, по фактической длине.
// Скидка: от 4 карнизов — 10 % на весь заказ (владелец, 27.10.2026).
import { describe, expect, it } from "vitest";
import { clampLength, cornicePrice, isOverMax, orderDiscount } from "../src/lib/pricing";

describe("cornicePrice", () => {
  it("1 м — базовая цена", () => {
    expect(cornicePrice({ length: 1, rows: 1 })).toBe(12000);
  });
  it("3 м — 18 000 сом", () => {
    expect(cornicePrice({ length: 3, rows: 1 })).toBe(18000);
  });
  it("3,2 м — неполный метр пропорционально", () => {
    expect(cornicePrice({ length: 3.2, rows: 1 })).toBe(18600);
  });
  it("два ряда — два карниза, без скидки за второй ряд", () => {
    expect(cornicePrice({ length: 3, rows: 2 })).toBe(36000);
  });
  it("несколько окон умножают цену", () => {
    expect(cornicePrice({ length: 3, rows: 1, windows: 2 })).toBe(36000);
  });
  it("длина больше 12 м считается как 12 м и помечается для индивидуального расчёта", () => {
    expect(cornicePrice({ length: 15, rows: 1 })).toBe(cornicePrice({ length: 12, rows: 1 }));
    expect(cornicePrice({ length: 12, rows: 1 })).toBe(45000);
    expect(clampLength(15)).toBe(12);
    expect(isOverMax(12.1)).toBe(true);
    expect(isOverMax(12)).toBe(false);
  });
  it("меньше 1 м — как 1 м", () => {
    expect(cornicePrice({ length: 0.4, rows: 1 })).toBe(12000);
  });
});

describe("orderDiscount", () => {
  it("3 карниза — без скидки", () => {
    expect(orderDiscount(54000, 3)).toBe(0);
  });
  it("4 карниза и больше — 10 % от всей суммы", () => {
    expect(orderDiscount(72000, 4)).toBe(7200);
    expect(orderDiscount(100000, 7)).toBe(10000);
  });
});
