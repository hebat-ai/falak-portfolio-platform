"use client";

import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatCurrency } from "@/lib/format";
import type { AdminCompanyDTO, AdminVehicleDTO, AdminOwnershipLinkDTO } from "@/lib/admin/dto";

interface CompanyCardGridProps {
  companies: AdminCompanyDTO[];
  period: string;
  vehicles: AdminVehicleDTO[];
  vehicleLinks: AdminOwnershipLinkDTO[];
}

export function CompanyCardGrid({ companies, period, vehicles, vehicleLinks }: CompanyCardGridProps) {
  const { t, lang } = useLanguage();

  if (companies.length === 0) {
    return <p className="py-8 text-center text-sm text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {companies.map((company) => {
        const periodData = company.periods[period];
        const links = vehicleLinks.filter((l) => l.companyId === company.id);
        const companyVehicles = links
          .map((l) => vehicles.find((v) => v.id === l.vehicleId))
          .filter((v): v is NonNullable<typeof v> => Boolean(v));

        return (
          <Card key={company.id} className="flex flex-col gap-3">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="font-heading text-base font-semibold text-foreground">
                  {lang === "ar" ? company.nameAr : company.nameEn}
                </h3>
                <p className="text-xs text-muted-foreground">{lang === "ar" ? company.sectorAr : company.sectorEn}</p>
              </div>
              <StatusBadge status={periodData.status} />
            </div>

            <dl className="grid grid-cols-2 gap-x-3 gap-y-1 text-xs">
              <dt className="text-muted-foreground">{t.admin.table.customerModelColumn}</dt>
              <dd className="text-foreground">{t.customerModels[company.customerModel]}</dd>
              <dt className="text-muted-foreground">{t.admin.table.currentStageColumn}</dt>
              <dd className="text-foreground">{t.stages[company.currentStage]}</dd>
              <dt className="text-muted-foreground">{t.admin.table.revenueColumn}</dt>
              <dd className="text-foreground">
                {periodData.revenue === null ? (
                  <span className="text-muted-foreground">{t.admin.table.noDataValue}</span>
                ) : (
                  <Num>{formatCurrency(periodData.revenue, company.currency, lang)}</Num>
                )}
              </dd>
              <dt className="text-muted-foreground">{t.admin.table.vehicleColumn}</dt>
              <dd className="flex flex-wrap gap-1">
                {companyVehicles.length === 0 ? (
                  <span className="text-foreground">—</span>
                ) : (
                  companyVehicles.map((v) => (
                    <Link
                      key={v.id}
                      href={`/vehicle/${v.slug}`}
                      className="chamfer-br-sm px-2 py-0.5 text-[11px] text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
                    >
                      {lang === "ar" ? v.nameAr : v.nameEn}
                    </Link>
                  ))
                )}
              </dd>
            </dl>

            <Link
              href={`/company/${company.slug}?period=${encodeURIComponent(period)}&from=companies`}
              className="chamfer-br-sm mt-auto inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium text-link-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
            >
              {t.admin.table.viewCompanyAction}
            </Link>
          </Card>
        );
      })}
    </div>
  );
}
