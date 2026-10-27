// Нормализация телефона — все форматы из ТЗ, раздел 17.
import { describe, expect, it } from "vitest";
import { normalizePhone } from "../src/lib/phone";
import { vi } from "vitest";

vi.mock("@/lib/phone", async () => await import("../src/lib/phone"));
const { checkPhone } = await import("../src/components/order/phone");

const e164 = (s: string) => normalizePhone(s)?.e164 ?? null;

describe("normalizePhone: Кыргызстан", () => {
  it.each(["+996 555 123 456", "996 555 123 456", "0555 123 456", "555 123 456", "8 (0555) 123 456", "+996555123456", " +996 (555) 12-34-56 "])("%s → +996555123456", (s) => {
    expect(e164(s)).toBe("+996555123456");
    expect(normalizePhone(s)?.country).toBe("kg");
  });
});

describe("normalizePhone: Казахстан и Россия", () => {
  it.each(["+7 701 123 45 67", "8 701 123 45 67", "+77011234567"])("%s → +77011234567", (s) => {
    expect(e164(s)).toBe("+77011234567");
    expect(normalizePhone(s)?.country).toBe("kz");
  });
});

describe("normalizePhone: другие страны", () => {
  it("международный номер с «+» — от 8 до 15 цифр", () => {
    expect(e164("+49 151 2345 6789")).toBe("+4915123456789");
    expect(normalizePhone("+49 151 2345 6789")?.country).toBe("intl");
  });
});

describe("normalizePhone: ошибки", () => {
  it.each(["", "   ", "abc", "12345", "0555 12", "8 701 123", "+1234567", "+1234567890123456"])("%j → null", (s) => {
    expect(normalizePhone(s)).toBeNull();
    expect(checkPhone(s)).toBeNull();
  });
  // normalizePhone пропускает их как «международные»; поле оформления проверяет строже (checkPhone).
  it.each(["+996 555 123", "+996 555 123 4567", "+7 701 123 45", "+7 701 123 45 678"])("%j → null (checkPhone)", (s) => {
    expect(checkPhone(s)).toBeNull();
  });
  it("checkPhone пропускает верные номера", () => {
    expect(checkPhone("0555 123 456")?.e164).toBe("+996555123456");
    expect(checkPhone("8 701 123 45 67")?.e164).toBe("+77011234567");
    expect(checkPhone("+49 151 2345 6789")?.e164).toBe("+4915123456789");
  });
});
