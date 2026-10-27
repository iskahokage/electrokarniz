// Маска поля телефона в оформлении: результат маски всегда проходит normalizePhone.
import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/phone", async () => await import("../src/lib/phone"));
const { formatPhone } = await import("../src/components/order/phone");
const { normalizePhone } = await import("../src/lib/phone");

describe("formatPhone", () => {
  it.each([
    ["0555123456", "+996 555 123 456"],
    ["8 (0555) 123 456", "+996 555 123 456"],
    ["555123456", "+996 555 123 456"],
    ["+996555123456", "+996 555 123 456"],
    ["8 701 123 45 67", "+7 701 123 45 67"],
    ["+77011234567", "+7 701 123 45 67"],
    ["+49 151 23456789", "+4915123456789"],
  ])("%s → %s", (raw, out) => {
    expect(formatPhone(raw)).toBe(out);
    expect(normalizePhone(out)).not.toBeNull();
  });
  it("набор по одной цифре «8 0555…» не превращается в чужой номер", () => {
    let v = "";
    for (const ch of "80555123456") v = formatPhone(v + ch);
    expect(v).toBe("+996 555 123 456");
  });
  it("удаление до конца не мешает", () => {
    expect(formatPhone("+99")).toBe("+99");
    expect(formatPhone("+")).toBe("+");
    expect(formatPhone("")).toBe("");
  });
});

describe("formatPhone поверх автоподставленного кода", () => {
  it("+996 и местный ноль или повтор кода", () => {
    expect(formatPhone("+9960555123456")).toBe("+996 555 123 456");
    expect(formatPhone("+996996555123456")).toBe("+996 555 123 456");
  });
  it("+7 и лишняя восьмёрка", () => {
    expect(formatPhone("+787011234567")).toBe("+7 701 123 45 67");
    expect(formatPhone("+78121234567")).toBe("+7 812 123 45 67");
  });
});
