import { site } from "@/content/site";

// Только прямая ссылка wa.me: во встроенном браузере Instagram window.open ненадёжен.
export function waLink(text: string) {
  return `https://wa.me/${site.whatsapp}?text=${encodeURIComponent(text)}`;
}
