import { Inter_Tight, IBM_Plex_Mono } from "next/font/google";

// Узкий гротеск (типографика концепта A) + моноширинный «голос» для данных. cyrillic-ext — для ң, ө, ү.
export const display = Inter_Tight({ subsets: ["latin", "cyrillic", "cyrillic-ext"], variable: "--font-display-x", display: "swap" });
export const mono = IBM_Plex_Mono({ subsets: ["latin", "cyrillic", "cyrillic-ext"], weight: ["400", "500"], variable: "--font-mono-x", display: "swap" });
