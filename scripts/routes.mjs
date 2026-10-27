// Генерирует обёртки страниц для обоих языков из одного реестра: /… (ru) и /ky/… (ky).
// Страница = view в src/views/<view>.tsx: default View({locale, params}), meta(locale, params), staticParams() для [slug].
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

export const routes = [
  { path: "", view: "home" },
  { path: "resheniya", view: "solutions" },
  { path: "resheniya/[slug]", view: "solution" },
  { path: "katalog", view: "catalog" },
  { path: "katalog/[slug]", view: "product" },
  { path: "brendy/[slug]", view: "brand" },
  { path: "upravlenie", view: "control" },
  { path: "raschet", view: "calculator" },
  { path: "korzina", view: "cart" },
  { path: "oformlenie", view: "checkout" },
  { path: "obekty", view: "projects" },
  { path: "obekty/[slug]", view: "project" },
  { path: "dostavka-i-oplata", view: "delivery" },
  { path: "garantiya", view: "warranty" },
  { path: "kontakty", view: "contacts" },
  { path: "usloviya", view: "terms" },
  { path: "privacy", view: "privacy" },
];

const page = (locale, view, dynamic) => `// Сгенерировано scripts/routes.mjs — не править руками.
import View, { meta${dynamic ? ", staticParams" : ""} } from "@/views/${view}";
${dynamic ? `
export const dynamicParams = false;
export function generateStaticParams() {
  return staticParams();
}

type P = { params: Promise<{ slug: string }> };
export async function generateMetadata({ params }: P) {
  return meta("${locale}", await params);
}
export default async function Page({ params }: P) {
  return <View locale="${locale}" params={await params} />;
}
` : `
export function generateMetadata() {
  return meta("${locale}");
}
export default function Page() {
  return <View locale="${locale}" params={{}} />;
}
`}`;

const roots = { ru: "src/app/(ru)", ky: "src/app/(ky)/ky" };
for (const [locale, root] of Object.entries(roots)) {
  for (const r of routes) {
    const dir = join(root, r.path);
    mkdirSync(dir, { recursive: true });
    writeFileSync(join(dir, "page.tsx"), page(locale, r.view, r.path.includes("[")));
  }
}
console.log(`routes: ${routes.length} × 2`);
