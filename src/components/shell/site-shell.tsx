import type { ReactNode } from "react";
import { display, mono } from "@/app/fonts";
import type { Locale } from "@/i18n";
import { Header } from "./header";
import { Footer } from "./footer";
import { BottomBar } from "./bottom-bar";
import { Analytics } from "./analytics";
import { businessLd, ldJson } from "@/lib/jsonld";

// Общая оболочка обоих корневых layout: у языков разные <html lang>, поэтому layout два.
export function SiteShell({ locale, children }: { locale: Locale; children: ReactNode }) {
  return (
    <html lang={locale} className={`${display.variable} ${mono.variable}`}>
      <body className="min-h-dvh antialiased">
        <Header locale={locale} />
        <main id="main">{children}</main>
        <Footer locale={locale} />
        <BottomBar locale={locale} />
        <Analytics />
        {/* Организация для поиска — на каждой странице; без адреса, пока нет шоурума. */}
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: ldJson(businessLd(locale)) }} />
      </body>
    </html>
  );
}
