"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { VehicleDirectoryEntryDTO } from "@/lib/vehicle/dto";

export function VehicleDirectoryClient({ vehicles }: { vehicles: VehicleDirectoryEntryDTO[] }) {
  const { t, lang } = useLanguage();

  return (
    <AppShell title={t.nav.vehicleDashboard} subtitle={t.vehicleDirectory.subtitle}>
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.vehicleDirectory.emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => (
            <Link
              key={vehicle.id}
              href={`/vehicle/${vehicle.slug}`}
              className="chamfer-br-lg flex flex-col gap-4 bg-surface p-4 shadow-[var(--inner-line)] transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
            >
              <div>
                <p className="font-heading text-base font-semibold text-foreground">
                  {lang === "ar" ? vehicle.nameAr : vehicle.nameEn}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.vehicleTypes[vehicle.type]} · {t.currencyNames[vehicle.currency]}
                </p>
              </div>
              <dl className="mt-auto grid grid-cols-2 gap-3 text-sm">
                <div>
                  <dt className="text-xs text-muted-foreground">{t.vehicleReport.companiesLabel}</dt>
                  <dd className="font-medium text-foreground">
                    <Num>{vehicle.companyCount}</Num>
                  </dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">{t.vehicleReport.investorsTitle}</dt>
                  <dd className="font-medium text-foreground">
                    <Num>{vehicle.investorCount}</Num>
                  </dd>
                </div>
              </dl>
            </Link>
          ))}
        </div>
      )}
    </AppShell>
  );
}
