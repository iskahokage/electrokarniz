// Генерирует OG-картинки public/og/default.png и default-ky.png (1200×630) и значок src/app/apple-icon.png (180×180).
// Запуск: node scripts/og.mjs. Шрифты (Inter Tight, IBM Plex Mono — те же, что на сайте) берутся из OG_FONT_DIR
// или один раз скачиваются из google/fonts в node_modules/.cache/og-fonts: в SVG без своих шрифтов librsvg подставит системный.
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";

const C = { paper: "#f5f2ec", paper2: "#ebe6dd", ink: "#171512", ink2: "#5f5b55", ink3: "#8a857d", line: "#d9d2c6", accent: "#2d5a43", fabric: "#ece6da" };

const FONTS = {
  display: { file: "InterTight.ttf", url: "https://github.com/google/fonts/raw/main/ofl/intertight/InterTight%5Bwght%5D.ttf" },
  mono: { file: "PlexMono.ttf", url: "https://github.com/google/fonts/raw/main/ofl/ibmplexmono/IBMPlexMono-Regular.ttf" },
};
const fontDir = process.env.OG_FONT_DIR || "node_modules/.cache/og-fonts";
mkdirSync(fontDir, { recursive: true });
for (const f of Object.values(FONTS)) {
  const p = join(fontDir, f.file);
  if (!existsSync(p)) {
    const res = await fetch(f.url);
    if (!res.ok) throw new Error(`Не скачался шрифт ${f.url}: ${res.status}`);
    writeFileSync(p, Buffer.from(await res.arrayBuffer()));
  }
}
const fontfile = (k) => join(fontDir, FONTS[k].file);
// Pango ищет шрифты через fontconfig; без конфига он молча берёт системный Helvetica. Даём свой минимальный.
const fcConf = join(fontDir, "fonts.conf");
writeFileSync(fcConf, `<?xml version="1.0"?><!DOCTYPE fontconfig SYSTEM "fonts.dtd"><fontconfig><dir>${resolve(fontDir)}</dir><cachedir>${resolve(fontDir)}/cache</cachedir></fontconfig>`);
process.env.FONTCONFIG_FILE = resolve(fcConf);
const { default: sharp } = await import("sharp");

/** Строка текста через Pango (sharp text): настоящие шрифты сайта с кириллицей. */
async function text(str, { font = "display", family = "Inter Tight", weight = "Semi-Bold", size, color = C.ink, spacing = 0 }) {
  const markup = `<span foreground="${color}" letter_spacing="${Math.round(spacing * 1024)}">${str}</span>`;
  const { data, info } = await sharp({
    text: { text: markup, font: `${family} ${weight} ${size}`, fontfile: fontfile(font), rgba: true, dpi: 72 },
  })
    .png()
    .toBuffer({ resolveWithObject: true });
  return { input: data, w: info.width, h: info.height };
}

// --- OG 1200×630 ---
const W = 1200;
const H = 630;
const PAD = 80;
const railY = 150;

// Справа — штора на рельсе, как в логотипе: складки тонкими линиями, бегунок — акцент. Без градиентов.
const folds = [];
for (let i = 0; i < 15; i++) {
  const x = 912 + i * 19 + (i % 2 ? 4 : 0);
  folds.push(`<line x1="${x}" y1="${railY + 8}" x2="${x + (i % 3) - 1}" y2="${H}" stroke="${C.ink}" stroke-opacity="${i % 2 ? 0.14 : 0.3}" stroke-width="1"/>`);
}
const bg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="${C.paper}"/>
  <rect x="900" y="${railY}" width="${W - 900}" height="${H - railY}" fill="${C.fabric}"/>
  ${folds.join("\n  ")}
  <rect x="0" y="${railY}" width="${W}" height="2" fill="${C.ink}"/>
  <rect x="1124" y="${railY - 5}" width="22" height="12" fill="${C.accent}"/>
  <rect x="0" y="${H - 1}" width="${W}" height="1" fill="${C.line}"/>
</svg>`;

// Логотип: короткий рельс с бегунком над словом (как src/components/shell/logo.tsx).
const logo = await text("электрокарниз", { size: 40, spacing: -1.3 });
const logoX = PAD;
const logoY = 62;
const logoRail = `<svg xmlns="http://www.w3.org/2000/svg" width="${logo.w}" height="12"><rect y="5" width="${logo.w}" height="2" fill="${C.ink}"/><rect x="${Math.round(logo.w * 0.82) - 18}" y="1" width="18" height="10" fill="${C.accent}"/></svg>`;

// Две версии: кыргызские страницы при отправке ссылки показывают кыргызский текст (черновик — владелец проверяет).
const OG = [
  { file: "public/og/default.png", h1: ["Электрокарнизы", "в Бишкеке"], lead: "Установка за 1 день · гарантия 5 лет" },
  { file: "public/og/default-ky.png", h1: ["Бишкекте", "электрокарниздер"], size: 86, lead: "1 күндө орнотуу · 5 жылдык кепилдик" },
];
const data = await text("electrokarniz.kg   +996 771 425 492", { font: "mono", family: "Monospace", weight: "Regular", size: 24, color: C.ink3 });
const top = 250;
for (const og of OG) {
  // Кыргызское слово длиннее: кегль меньше, чтобы текст не заходил на штору справа (x 900).
  const size = og.size ?? 96;
  const h1a = await text(og.h1[0], { size, spacing: -3.8 * (size / 96) });
  const h1b = await text(og.h1[1], { size, spacing: -3.8 * (size / 96) });
  if (PAD - 4 + Math.max(h1a.w, h1b.w) > 880) throw new Error(`Заголовок OG шире поля: ${og.file}`);
  const lead = await text(og.lead, { weight: "Regular", size: 32, color: C.ink2, spacing: -0.5 });
  await sharp(Buffer.from(bg))
    .composite([
      { input: Buffer.from(logoRail), left: logoX, top: logoY - 4 },
      { input: logo.input, left: logoX, top: logoY + 12 },
      { input: h1a.input, left: PAD - 4, top },
      { input: h1b.input, left: PAD - 4, top: top + Math.round(size * 1.04) },
      { input: lead.input, left: PAD, top: top + 236 },
      { input: data.input, left: PAD, top: H - 64 },
    ])
    .png({ compressionLevel: 9 })
    .toFile(og.file);
}

// --- apple-icon 180×180: тот же знак, что в src/app/icon.svg, на сплошном фоне (iOS не любит прозрачность) ---
const apple = `<svg xmlns="http://www.w3.org/2000/svg" width="180" height="180" viewBox="0 0 32 32">
  <rect width="32" height="32" fill="${C.paper}"/>
  <rect x="5" y="9" width="22" height="1.6" fill="${C.ink}"/>
  <rect x="18" y="7.3" width="6" height="5" fill="${C.accent}"/>
  <path d="M7 12v13M9.5 12v13M12 12v13M14.5 12v13" stroke="${C.ink}" stroke-width="1.2" fill="none"/>
</svg>`;
await sharp(Buffer.from(apple)).png().toFile("src/app/apple-icon.png");

console.log("og: public/og/default.png, public/og/default-ky.png, src/app/apple-icon.png");
