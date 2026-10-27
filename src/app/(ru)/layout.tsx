import "../globals.css";
import type { Metadata, Viewport } from "next";
import { SiteShell } from "@/components/shell/site-shell";
import { site } from "@/content/site";

export const metadata: Metadata = { metadataBase: new URL(site.url), title: { default: "Электрокарниз", template: "%s — Электрокарниз" } };
export const viewport: Viewport = { themeColor: "#f5f2ec", width: "device-width", initialScale: 1, viewportFit: "cover" };

export default function RuLayout({ children }: { children: React.ReactNode }) {
  return <SiteShell locale="ru">{children}</SiteShell>;
}
