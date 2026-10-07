"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import type { InvestorNewsItemDTO } from "@/lib/investor/dto";

// Latest news: each startup's Investment Review Notes from its most
// recent report this investor can see, newest first.
export function InvestorNewsCard({ items }: { items: InvestorNewsItemDTO[] }) {
  const { t, lang } = useLanguage();

  return (
    <Card className="flex min-w-0 flex-col">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.investorDashboard.latestNewsTitle}</h2>
      {items.length === 0 ? (
        <p className="mt-3 text-sm text-muted-foreground">{t.investorDashboard.noNewsMessage}</p>
      ) : (
        <ul className="scrollbar-thin mt-3 max-h-[28rem] space-y-4 overflow-y-auto pe-1">
          {items.map((item) => {
            const text = (lang === "ar" ? item.textAr : item.textEn).trim() || (lang === "ar" ? item.textEn : item.textAr);
            return (
              <li key={item.companyId} className="border-b border-border-subtle pb-4 last:border-b-0 last:pb-0">
                <div className="flex flex-wrap items-baseline justify-between gap-2">
                  <Link
                    href={`/company/${item.companySlug}/report?period=${encodeURIComponent(item.periodKey)}&from=investor`}
                    className="font-medium text-link-foreground underline-offset-2 hover:underline"
                  >
                    {lang === "ar" ? item.companyNameAr : item.companyNameEn}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {item.periodKey}
                    {item.publishedAt ? ` · ${formatDate(item.publishedAt.slice(0, 10), lang)}` : ""}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-5 whitespace-pre-line text-sm text-foreground">{text}</p>
              </li>
            );
          })}
        </ul>
      )}
    </Card>
  );
}
