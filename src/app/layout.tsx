import type { Metadata } from "next";
import { jost, inter, cairo, alexandria } from "@/lib/fonts";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: "Falak Portfolio Platform",
  description:
    "Falak Ventures portfolio monitoring & investor reporting",
  // Defense in depth only: Deployment Protection is the real access control.
  robots: {
    index: false,
    follow: false,
    noarchive: true,
    nosnippet: true,
    noimageindex: true,
    nocache: true,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      dir="ltr"
      className={`${jost.variable} ${inter.variable} ${cairo.variable} ${alexandria.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>{children}</LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
