"use client";

import { BrandMark } from "@/components/brand/BrandMark";
import { Card } from "@/components/ui/Card";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { ThemeSwitcher } from "@/components/layout/ThemeSwitcher";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { SignInForm } from "./sign-in/SignInForm";
import { SignUpForm } from "./sign-up/SignUpForm";

export function HomeMarketing() {
  const { t } = useLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="flex items-center justify-between px-4 py-4 sm:px-6">
        <BrandMark />
        <div className="flex items-center gap-3 text-sm">
          <ThemeSwitcher />
          <LanguageSwitcher />
        </div>
      </header>

      <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col justify-center gap-10 px-4 py-12 sm:px-6">
        <div className="max-w-2xl space-y-2">
          <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">{t.home.title}</h1>
          <p className="text-sm text-muted-foreground">{t.home.tagline}</p>
        </div>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <Card className="space-y-4">
            <h2 className="font-heading text-base font-semibold text-foreground">{t.home.signInHeading}</h2>
            <SignInForm />
          </Card>

          <Card className="space-y-4">
            <h2 className="font-heading text-base font-semibold text-foreground">{t.home.signUpHeading}</h2>
            <p className="text-xs text-muted-foreground">{t.home.signUpPrompt}</p>
            <SignUpForm />
          </Card>
        </div>
      </main>
    </div>
  );
}
