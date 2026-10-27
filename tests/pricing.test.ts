// Формула владельца: 13 000 сом первый метр + 3 000 сом за каждый следующий, по фактической длине.
import { describe, expect, it } from "vitest";
import { clampLength, cornicePrice, isOverMax } from "../src/lib/pricing";

describe("cornicePrice", () => {
  it("1 м — базовая цена", () => {
    expect(cornicePrice({ length: 1, rows: 1 })).toBe(13000);
  });
  it("3 м — 19 000 сом (пример владельца)", () => {
    expect(cornicePrice({ length: 3, rows: 1 })).toBe(19000);
  });
  it("3,2 м — неполный метр пропорционально", () => {
    expect(cornicePrice({ length: 3.2, rows: 1 })).toBe(19600);
  });
  it("два ряда — два карниза", () => {
    expect(cornicePrice({ length: 3, rows: 2 })).toBe(38000);
  });
  it("несколько окон умножают цену", () => {
    expect(cornicePrice({ length: 3, rows: 1, windows: 2 })).toBe(38000);
  });
  it("длина больше 12 м считается как 12 м и помечается для индивидуального расчёта", () => {
    expect(cornicePrice({ length: 15, rows: 1 })).toBe(cornicePrice({ length: 12, rows: 1 }));
    expect(cornicePrice({ length: 12, rows: 1 })).toBe(46000);
    expect(clampLength(15)).toBe(12);
    expect(isOverMax(12.1)).toBe(true);
    expect(isOverMax(12)).toBe(false);
  });
  it("меньше 1 м — как 1 м", () => {
    expect(cornicePrice({ length: 0.4, rows: 1 })).toBe(13000);
  });
});
