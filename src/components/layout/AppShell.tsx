"use client";

import { useId, useState, type ReactNode } from "react";
import { Sidebar, SidebarNavList } from "./Sidebar";
import { TopHeader } from "./TopHeader";
import { MobileDrawer } from "./MobileDrawer";
import { useLanguage } from "@/lib/i18n/LanguageProvider";

const MOBILE_DRAWER_ID = "mobile-navigation-drawer";

interface AppShellProps {
  title: string;
  subtitle?: string;
  children: ReactNode;
}

export function AppShell({ title, subtitle, children }: AppShellProps) {
  const { t } = useLanguage();
  const [menuOpen, setMenuOpen] = useState(false);
  const titleId = useId();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />

      <MobileDrawer
        id={MOBILE_DRAWER_ID}
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        titleId={titleId}
        title={t.common.appName}
        closeLabel={t.nav.closeMenu}
      >
        <SidebarNavList onNavigate={() => setMenuOpen(false)} />
      </MobileDrawer>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopHeader
          title={title}
          subtitle={subtitle}
          menuOpen={menuOpen}
          onOpenMenu={() => setMenuOpen(true)}
          drawerId={MOBILE_DRAWER_ID}
        />
        <main className="min-w-0 flex-1 px-4 py-6 sm:px-6">{children}</main>
      </div>
    </div>
  );
}
