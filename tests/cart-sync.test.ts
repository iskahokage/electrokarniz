// Сверка корзины с каталогом: старая цена из localStorage не уходит в заказ, пропавший товар помечается.
import { describe, expect, it } from "vitest";
import { syncItem } from "../src/lib/cart-sync";
import { products } from "../src/content/catalog";
import type { CartItem } from "../src/lib/cart";

const kit = products.find((p) => p.kind === "kit")!;
const metered = products.find((p) => p.price.per?.ru === "за метр");

describe("syncItem", () => {
  it("пересчитывает цену комплекта по текущей формуле", () => {
    const item: CartItem = {
      id: "x",
      slug: kit.slug,
      kind: "kit",
      title: { ru: "старое", ky: "эски" },
      qty: 1,
      unitPrice: 1,
      config: { length: 3, opening: "center", mount: "ceiling", control: "remote", rows: 1, region: "bishkek" },
    };
    const next = syncItem(item);
    expect(next.unitPrice).toBe(18_000);
    expect(next.title).toEqual(kit.title);
    expect(next.gone).toBeUndefined();
  });

  it("помечает товар, которого нет в каталоге", () => {
    const next = syncItem({ id: "y", slug: "net-takogo", kind: "item", title: { ru: "a", ky: "a" }, qty: 2, unitPrice: 500 });
    expect(next.gone).toBe(true);
    expect(next.unitPrice).toBeNull();
  });

  it.runIf(!!metered)("ставит метры для товара «за метр»", () => {
    const next = syncItem({ id: "z", slug: metered!.slug, kind: "item", title: metered!.title, qty: 3, unitPrice: null });
    expect(next.unit).toBe("m");
  });
});
