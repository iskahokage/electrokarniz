"use client";

// Страница со своей нижней полосой (калькулятор) сообщает, видна ли она сейчас.
// Пока полоса видна, общая нижняя панель спрятана; полоса уехала — панель возвращается.
import { useSyncExternalStore } from "react";

let shown = true;
const listeners = new Set<() => void>();

export function setOwnSticky(v: boolean) {
  if (shown === v) return;
  shown = v;
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** На сервере — true: в HTML панель спрятана, как и раньше, пока калькулятор не скажет иное. */
export function useOwnSticky() {
  return useSyncExternalStore(subscribe, () => shown, () => true);
}
