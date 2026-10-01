"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { InviteForm } from "../_components/InviteForm";
import { createCompanyInviteAction, createInvestorInviteAction } from "../../actions";
import type { AdminCompanyDTO, AdminInvestorDTO } from "@/lib/admin/dto";

interface InvitesClientProps {
  companies: AdminCompanyDTO[];
  investors: AdminInvestorDTO[];
}

export function InvitesClient({ companies, investors }: InvitesClientProps) {
  const { t } = useLanguage();

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createInviteTitle}</h3>
        <InviteForm
          action={createCompanyInviteAction}
          idPrefix="inv-company"
          selectName="companyId"
          selectLabel={t.admin.manage.companyLabel}
          options={companies}
        />
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createInvestorInviteTitle}</h3>
        <InviteForm
          action={createInvestorInviteAction}
          idPrefix="inv-investor"
          selectName="investorId"
          selectLabel={t.admin.manage.investorLabel}
          options={investors.filter((i) => !i.archivedAt)}
        />
      </div>
    </div>
  );
}
