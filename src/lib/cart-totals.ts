// Итог корзины отдельно от текстов заказа: его читает и шапка (счётчик), а тянуть туда строки i18n незачем.
// Импорты относительные: файл проверяется в vitest без настройки алиасов.
import type { CartItem } from "./cart";
import { orderDiscount } from "./pricing";

/** Сколько карнизов в заказе: комплект в два ряда — два карниза (как и в цене). */
export function cornicesCount(items: CartItem[]) {
  return items.reduce((s, i) => (i.kind === "kit" && !i.gone ? s + i.qty * (i.config?.rows ?? 1) : s), 0);
}

/** Сумма, скидка за количество карнизов и итог. Скидка — на всю сумму заказа, не по позициям. */
export function cartTotals(items: CartItem[]) {
  const subtotal = items.reduce((s, i) => s + (i.gone ? 0 : (i.unitPrice ?? 0) * i.qty), 0);
  const cornices = cornicesCount(items);
  const discount = orderDiscount(subtotal, cornices);
  const hasUnknown = items.some((i) => i.unitPrice == null);
  return { subtotal, discount, total: subtotal - discount, cornices, hasUnknown };
}
