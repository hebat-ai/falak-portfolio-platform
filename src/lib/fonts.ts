import { Jost, Inter, Cairo } from "next/font/google";
import localFont from "next/font/local";

// Temporary placeholders for Falak's approved brand fonts (Century Gothic /
// Zunburk OS), pending confirmation that their proprietary licenses permit
// web/app embedding. See PROTOTYPE_NOTES.md.
export const jost = Jost({
  subsets: ["latin"],
  weight: ["500", "600", "700"],
  variable: "--font-jost",
  display: "swap",
});

export const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-inter",
  display: "swap",
});

export const cairo = Cairo({
  subsets: ["arabic"],
  weight: ["500", "600", "700"],
  variable: "--font-cairo",
  display: "swap",
});

// Alexandria -- (c) 2022 The Alexandria Project Authors
// (github.com/Gue3bara/Alexandria), SIL Open Font License 1.1, verified via
// this exact file's own embedded name-table metadata (see
// src/fonts/open-source/OFL.txt for the verbatim license). Freely
// embeddable; this is Falak's actual approved Arabic body typeface, not a
// placeholder.
export const alexandria = localFont({
  src: "../fonts/open-source/alexandria-variable.ttf",
  weight: "100 900",
  variable: "--font-alexandria",
  fallback: ["Segoe UI", "Tahoma", "sans-serif"],
  display: "swap",
});
