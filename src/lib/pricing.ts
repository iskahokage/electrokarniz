// Формула владельца (У1, У2): первый метр с мотором — база, каждый следующий — по фактической длине.
// База — 12 000 сом (владелец, 27.10.2026: «цена от 12 000, а не от 13 000»).
// Итог по заказу может разойтись на 3–5 тыс. сом после замера — это пишем рядом с ценой.

export const PRICING = {
  baseFirstMeter: 12_000,
  perMeter: 3_000,
  minLength: 1,
  maxLength: 12,
  minOrder: 12_000,
  outOfTownFrom: 1_000,
  // Выезд на установку в регион (владелец, 27.10.2026): дорога туда и обратно.
  tripIssykKul: 10_000,
  tripOsh: 15_000,
} as const;

// Постоянная скидка (владелец, 27.10.2026): больше 3 карнизов — 10 % на итоговую сумму заказа,
// по позициям не делим. Двухрядный карниз — два карниза, как и в цене.
export const DISCOUNT = { minCornices: 4, percent: 10 } as const;

export function orderDiscount(subtotal: number, cornices: number): number {
  return cornices >= DISCOUNT.minCornices ? Math.round((subtotal * DISCOUNT.percent) / 100) : 0;
}

export type CalcInput = {
  length: number; // метры
  rows: 1 | 2; // два ряда — два карниза, скидки за второй ряд нет (У3, 27.10.2026)
  windows?: number;
  base?: number | null; // база мотора из каталога, если отличается
  perMeter?: number | null;
};

export function clampLength(length: number) {
  return Math.min(Math.max(length, PRICING.minLength), PRICING.maxLength);
}

export function cornicePrice({ length, rows, windows = 1, base, perMeter }: CalcInput): number {
  const l = clampLength(length);
  const one = (base ?? PRICING.baseFirstMeter) + (l - 1) * (perMeter ?? PRICING.perMeter);
  // Округляем до сотни: точность до сома в оценке выглядит как ложная точность.
  return Math.round((one * rows * Math.max(1, windows)) / 100) * 100;
}

export function isOverMax(length: number) {
  return length > PRICING.maxLength;
}
