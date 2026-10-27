// Разбор адреса калькулятора: ссылки с объектов (m = монтаж), из корзины (m = модель), с решений (type = slug).
import { describe, expect, it } from "vitest";
import { DEFAULTS, fromQuery, parseStored, sanitize, toQuery } from "../src/components/order/calc-state";

const q = (s: string) => fromQuery(new URLSearchParams(s));

describe("fromQuery", () => {
  it("пустой адрес — ничего не меняет", () => {
    expect(q("")).toBeNull();
  });

  it("длина с запятой и точкой, округление до 10 см, потолок 50 м", () => {
    expect(q("l=3,25")?.l).toBe(3.3);
    expect(q("l=4.1")?.l).toBe(4.1);
    expect(q("l=999")?.l).toBe(50);
    expect(q("l=abc")).toBeNull();
    expect(q("l=-2")).toBeNull();
  });

  it("m=ceiling|wall|niche со страницы объекта — это монтаж", () => {
    const s = q("l=4.1&o=side&m=niche&c=alice");
    expect(s).toMatchObject({ type: "sliding", l: 4.1, o: 1, mt: 2, c: 2 });
    expect(s?.m).toBeUndefined();
  });

  it("m=<slug комплекта> — выбранная модель, mt — монтаж", () => {
    expect(q("m=dooya-dt82tv&mt=wall")).toMatchObject({ type: "sliding", m: "dooya-dt82tv", mt: 1 });
    expect(q("model=novo-mini")).toMatchObject({ m: "novo-mini" });
  });

  it("неизвестный slug модели игнорируется", () => {
    expect(q("m=nope")).toBeNull();
  });

  it("type: и тип калькулятора, и slug решения", () => {
    expect(q("type=roman")?.type).toBe("roman");
    expect(q("type=rimskie")?.type).toBe("roman");
    expect(q("type=skrytyy-v-nishu")).toMatchObject({ type: "sliding", mt: 2 });
    expect(q("type=dvuhryadnye")).toMatchObject({ type: "sliding", r: 1 });
    expect(q("type=nope")).toBeNull();
  });

  it("окна: 1–20, остальное отбрасываем", () => {
    expect(q("w=3")?.w).toBe(3);
    expect(q("w=0")).toBeNull();
    expect(q("w=21")).toBeNull();
    expect(q("w=2.5")).toBeNull();
  });

  it("toQuery → fromQuery возвращает то же состояние", () => {
    const st = { ...DEFAULTS, l: 5.6, o: 1, mt: 2, sh: 1, r: 1, f: 2, c: 1, rg: 3, w: 2, m: "dooya-dt52e" };
    expect({ ...DEFAULTS, ...q(toQuery(st)) }).toEqual(st);
  });
});

describe("parseStored / sanitize", () => {
  it("битый JSON и не-объекты — null", () => {
    expect(parseStored("{")).toBeNull();
    expect(parseStored(null)).toBeNull();
    expect(sanitize(5)).toBeNull();
  });

  it("отбрасывает индексы вне диапазона и чужие модели", () => {
    expect(sanitize({ o: 9, mt: 1, type: "x", m: "pult-dooya-dc1660", w: 99, l: 2 })).toEqual({ mt: 1, l: 2 });
  });
});
