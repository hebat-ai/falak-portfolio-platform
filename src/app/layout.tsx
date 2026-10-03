import type { Metadata } from "next";
import { jost, inter, cairo, alexandria } from "@/lib/fonts";
import { LanguageProvider } from "@/lib/i18n/LanguageProvider";
import { ThemeProvider } from "@/lib/theme/ThemeProvider";
import { ViewerNavFlagsProvider } from "@/lib/auth/ViewerNavFlagsProvider";
import { getViewerNavFlags } from "@/lib/auth/viewer-roles";
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

export default async function RootLayout({ children }: LayoutProps<"/">) {
  // Fetched once per request, for every page including unauthenticated
  // ones (getCurrentUser()/the three membership checks all resolve to
  // "none" cheaply and safely when there's no session) -- see
  // getViewerNavFlags's own comment for why this is a nav-visibility
  // hint only, never a substitute for each page's own real auth check.
  const navFlags = await getViewerNavFlags();

  return (
    <html
      lang="en"
      dir="ltr"
      className={`${jost.variable} ${inter.variable} ${cairo.variable} ${alexandria.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <ThemeProvider>
          <LanguageProvider>
            <ViewerNavFlagsProvider value={navFlags}>{children}</ViewerNavFlagsProvider>
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
