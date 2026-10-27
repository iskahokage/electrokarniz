// Формула владельца (У1, У2): первый метр с мотором — база, каждый следующий — по фактической длине.
// Итог по заказу может разойтись на 3–5 тыс. сом после замера — это пишем рядом с ценой.

export const PRICING = {
  baseFirstMeter: 13_000,
  perMeter: 3_000,
  minLength: 1,
  maxLength: 12,
  minOrder: 13_000,
  outOfTownFrom: 1_000,
} as const;

export type CalcInput = {
  length: number; // метры
  rows: 1 | 2; // два ряда — два карниза (допущение по У3)
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
