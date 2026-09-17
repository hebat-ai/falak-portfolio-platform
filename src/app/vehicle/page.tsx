"use client";

import Link from "next/link";
import { AppShell } from "@/components/layout/AppShell";
import { Num } from "@/components/ui/Num";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { companies } from "@/lib/mock/companies";
import { vehicles, vehicleCompanyLinks } from "@/lib/mock/vehicles";
import { investors, investorVehicleExposures } from "@/lib/mock/investors";

// Same existence check /vehicle/[slug]/page.tsx already applies when it
// resolves linkedCompanies/linkedInvestors -- a link row pointing at an id
// that no longer exists in `companies`/`investors` is dropped before
// counting, not just deduplicated, so this directory can never disagree
// with the per-vehicle dashboard about how many are actually linked.
const VALID_COMPANY_IDS = new Set(companies.map((c) => c.id));
const VALID_INVESTOR_IDS = new Set(investors.map((i) => i.id));

export default function VehicleDirectoryPage() {
  const { t, lang } = useLanguage();

  return (
    <AppShell title={t.nav.vehicleDashboard} subtitle={t.vehicleDirectory.subtitle}>
      {vehicles.length === 0 ? (
        <p className="text-sm text-muted-foreground">{t.vehicleDirectory.emptyMessage}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {vehicles.map((vehicle) => {
            // Deduplicated by the linked entity's own id, and only counted
            // if that id actually resolves to a real company/investor --
            // a duplicated relationship row can't inflate this, and neither
            // can a dangling id that points at nothing.
            const companyCount = new Set(
              vehicleCompanyLinks
                .filter((l) => l.vehicleId === vehicle.id && VALID_COMPANY_IDS.has(l.companyId))
                .map((l) => l.companyId)
            ).size;
            const investorCount = new Set(
              investorVehicleExposures
                .filter((e) => e.vehicleId === vehicle.id && VALID_INVESTOR_IDS.has(e.investorId))
                .map((e) => e.investorId)
            ).size;

            return (
              <Link
                key={vehicle.id}
                href={`/vehicle/${vehicle.slug}`}
                className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-4 shadow-sm transition-colors hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground focus-visible:ring-offset-2 focus-visible:ring-offset-surface"
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
                      <Num>{companyCount}</Num>
                    </dd>
                  </div>
                  <div>
                    <dt className="text-xs text-muted-foreground">{t.vehicleReport.investorsTitle}</dt>
                    <dd className="font-medium text-foreground">
                      <Num>{investorCount}</Num>
                    </dd>
                  </div>
                </dl>
              </Link>
            );
          })}
        </div>
      )}
    </AppShell>
  );
}
