import "./globals.css";
import type { Metadata } from "next";
import { display, mono } from "./fonts";
import { Logo } from "@/components/shell/logo";
import { waLink } from "@/lib/whatsapp";

// noindex Next.js ставит на 404 сам — свой robots давал второй такой же тег.
export const metadata: Metadata = { title: "Страница не найдена — Электрокарниз" };

const copy = {
  ru: {
    home: "/",
    homeLabel: "На главную",
    title: "Страница не найдена",
    calc: "Рассчитать стоимость",
    ask: "Искали что-то конкретное?",
    wa: "Напишите в WhatsApp",
    waText: "Здравствуйте! Не нашёл страницу на сайте, подскажите.",
  },
  ky: {
    home: "/ky/",
    homeLabel: "Башкы бетке",
    title: "Барак табылган жок",
    calc: "Баасын эсептөө",
    ask: "Бир нерсе издеп жатасызбы?",
    wa: "WhatsApp'ка жазыңыз",
    waText: "Саламатсызбы! Сайттан баракты таппадым, жардам бериңизчи.",
  },
} as const;

// Общая 404 для обоих языков: у сайта два корневых layout, поэтому global-not-found.
// Статический хостинг отдаёт один 404.html на всё, язык узнаём по адресу до первой отрисовки.
const detect = `if(/^\\/ky(\\/|$)/.test(location.pathname)){document.documentElement.lang="ky";document.documentElement.dataset.loc="ky"}`;

export default function GlobalNotFound() {
  return (
    <html lang="ru" suppressHydrationWarning className={`${display.variable} ${mono.variable}`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: detect }} />
        <style>{`html[data-loc="ky"] .nf-ru{display:none}html:not([data-loc="ky"]) .nf-ky{display:none}`}</style>
      </head>
      <body className="min-h-dvh antialiased">
        {(["ru", "ky"] as const).map((l) => {
          const c = copy[l];
          return (
            <main key={l} lang={l} className={`nf-${l} mx-auto flex min-h-dvh max-w-3xl flex-col justify-center px-4 py-16`}>
              {/* Обычные <a>: у языков разные корневые layout, переход всё равно полный. */}
              <a href={c.home} aria-label="Электрокарниз" className="mb-12 inline-flex min-h-11 items-center self-start">
                <Logo />
              </a>
              <p className="t-data">404</p>
              <h1 className="t-h1 mt-3">{c.title}</h1>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href={c.home} className="btn btn-ink">{c.homeLabel}</a>
                <a href={`${c.home}raschet/`} className="btn btn-line">{c.calc}</a>
              </div>
              {/* Главное действие сайта — WhatsApp; здесь текстовой ссылкой, чтобы не спорить с кнопкой «На главную». */}
              <p className="mt-8 text-[15px] text-ink-2">
                {c.ask}{" "}
                <a href={waLink(c.waText)} className="inline-flex min-h-11 items-center text-ink underline decoration-1 underline-offset-4">
                  {c.wa}
                </a>
              </p>
              <p className="mt-2 text-[15px] text-ink-3">
                <a href={l === "ru" ? "/ky/" : "/"} lang={l === "ru" ? "ky" : "ru"} className="inline-flex min-h-11 items-center underline decoration-1 underline-offset-4">
                  {l === "ru" ? "Кыргызча" : "Русская версия"}
                </a>
              </p>
            </main>
          );
        })}
      </body>
    </html>
  );
}
