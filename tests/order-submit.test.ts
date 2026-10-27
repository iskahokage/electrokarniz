// Заказ не теряется молча: без адреса — тестовый номер, сбой скрипта — ok:false (экран «отправьте в WhatsApp»).
import { afterEach, describe, expect, it, vi } from "vitest";
import { buildPayload, submitOrder } from "../src/lib/order";

const form = { name: "Айгерим", phone: "+996555123456", method: "install-bishkek" as const, city: "Бишкек", address: "", comment: "", payment: null };
const payload = buildPayload(form, [{ id: "a", slug: "a", kind: "item", title: { ru: "Пульт", ky: "Пульт" }, qty: 1, unitPrice: null }], "ru", 5000, "");

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

describe("submitOrder", () => {
  it("без NEXT_PUBLIC_ORDER_ENDPOINT — номер DEV-…", async () => {
    vi.stubEnv("NEXT_PUBLIC_ORDER_ENDPOINT", "");
    vi.spyOn(console, "info").mockImplementation(() => {});
    const r = await submitOrder(payload);
    expect(r.ok && r.number.startsWith("DEV-") && r.dev).toBe(true);
  });

  it("скрипт ответил номером — ok", async () => {
    vi.stubEnv("NEXT_PUBLIC_ORDER_ENDPOINT", "https://example.test/exec");
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 200, json: async () => ({ ok: true, number: "EK-1001" }) })));
    expect(await submitOrder(payload)).toEqual({ ok: true, number: "EK-1001" });
  });

  it("сеть упала или скрипт вернул ошибку — ok:false", async () => {
    vi.stubEnv("NEXT_PUBLIC_ORDER_ENDPOINT", "https://example.test/exec");
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("Failed to fetch"); }));
    expect((await submitOrder(payload)).ok).toBe(false);
    vi.stubGlobal("fetch", vi.fn(async () => ({ status: 200, json: async () => ({ ok: false, error: "phone" }) })));
    expect(await submitOrder(payload)).toEqual({ ok: false, error: "phone" });
  });

  it("в заявке есть позиции и метка «цена по запросу»", () => {
    expect(payload.items[0]).toMatchObject({ title: "Пульт", qty: 1, lineTotal: null });
    expect(payload.hasUnknown).toBe(true);
    expect(payload.type).toBe("order");
  });
});
