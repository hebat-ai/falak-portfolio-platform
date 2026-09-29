"use client";

import { AppShell } from "@/components/layout/AppShell";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { RevokeButton } from "./RevokeButton";
import {
  revokeCompanyMembershipAction,
  revokeInvestorMembershipAction,
  revokeCompanyInviteAction,
  revokeInvestorInviteAction,
} from "../actions";
import type { AccessData, AccessOrgDTO } from "@/lib/access/dto";

interface OrgListProps {
  orgs: AccessOrgDTO[];
  canRevoke: boolean;
  revokeMember: (formData: FormData) => Promise<void>;
  revokeInvite: (formData: FormData) => Promise<void>;
}

function OrgList({ orgs, canRevoke, revokeMember, revokeInvite }: OrgListProps) {
  const { t, lang } = useLanguage();

  if (orgs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.access.noOrgs}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {orgs.map((org) => (
        <details key={org.id} className="rounded-xl border border-border-subtle bg-surface">
          <summary className="flex cursor-pointer flex-wrap items-center justify-between gap-2 px-4 py-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground">
            <span className="font-medium text-foreground">{lang === "ar" ? org.nameAr : org.nameEn}</span>
            <span className="text-xs text-muted-foreground">
              {t.access.summaryCounts
                .replace("{members}", String(org.members.length))
                .replace("{invites}", String(org.invites.length))}
            </span>
          </summary>

          <div className="grid grid-cols-1 gap-4 border-t border-border-subtle px-4 py-3 lg:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground">{t.access.membersLabel}</h4>
              {org.members.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.access.noMembers}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border-subtle">
                  {org.members.map((m) => (
                    <li key={m.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="break-all text-foreground">{m.email}</span>
                        <span className="ms-2 text-xs text-muted-foreground">
                          {t.access.roles[m.role]} · {t.access.joinedLabel}{" "}
                          <time dateTime={m.joinedAt}>{formatDate(m.joinedAt, lang)}</time>
                        </span>
                      </span>
                      {canRevoke ? (
                        <RevokeButton
                          action={revokeMember}
                          fieldName="membershipId"
                          id={m.id}
                          label={t.access.revokeAction}
                          confirmMessage={t.access.confirmRevoke.replace("{email}", m.email)}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <h4 className="text-xs font-semibold text-muted-foreground">{t.access.pendingInvitesLabel}</h4>
              {org.invites.length === 0 ? (
                <p className="text-sm text-muted-foreground">{t.access.noInvites}</p>
              ) : (
                <ul className="flex flex-col divide-y divide-border-subtle">
                  {org.invites.map((inv) => (
                    <li key={inv.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                      <span className="min-w-0">
                        <span className="break-all text-foreground">{inv.email}</span>
                        <span className="ms-2 text-xs text-muted-foreground">
                          {t.access.sentLabel} <time dateTime={inv.createdAt}>{formatDate(inv.createdAt, lang)}</time> ·{" "}
                          {t.access.expiresLabel} <time dateTime={inv.expiresAt}>{formatDate(inv.expiresAt, lang)}</time>
                        </span>
                      </span>
                      {canRevoke ? (
                        <RevokeButton
                          action={revokeInvite}
                          fieldName="inviteId"
                          id={inv.id}
                          label={t.access.cancelInviteAction}
                          confirmMessage={t.access.confirmCancelInvite.replace("{email}", inv.email)}
                        />
                      ) : null}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </details>
      ))}
    </div>
  );
}

export function AccessClient({ companies, investors, canRevoke }: AccessData) {
  const { t } = useLanguage();

  return (
    <AppShell title={t.nav.access} subtitle={t.access.subtitle}>
      <div className="space-y-6">
        {!canRevoke ? <p className="text-sm text-muted-foreground">{t.access.viewOnlyNote}</p> : null}

        <section aria-labelledby="access-companies" className="space-y-3">
          <h2 id="access-companies" className="font-heading text-sm font-semibold text-foreground">
            {t.access.companiesTitle}
          </h2>
          <OrgList
            orgs={companies}
            canRevoke={canRevoke}
            revokeMember={revokeCompanyMembershipAction}
            revokeInvite={revokeCompanyInviteAction}
          />
        </section>

        <section aria-labelledby="access-investors" className="space-y-3">
          <h2 id="access-investors" className="font-heading text-sm font-semibold text-foreground">
            {t.access.investorsTitle}
          </h2>
          <OrgList
            orgs={investors}
            canRevoke={canRevoke}
            revokeMember={revokeInvestorMembershipAction}
            revokeInvite={revokeInvestorInviteAction}
          />
        </section>
      </div>
    </AppShell>
  );
}
