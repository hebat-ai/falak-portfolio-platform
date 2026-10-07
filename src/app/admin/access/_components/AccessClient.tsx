"use client";

import { AppShell } from "@/components/layout/AppShell";
import { InviteStaffUserForm } from "@/app/admin/manage/_components/InviteStaffUserForm";
import { StaffUsersTable } from "@/app/admin/manage/_components/StaffUsersTable";
import type { StaffUserRow } from "@/lib/admin/staff";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { formatDate } from "@/lib/format";
import { useListView, byText, byValue } from "@/components/lists/useListView";
import { RevokeButton } from "./RevokeButton";
import { ApproveRequestForm } from "./ApproveRequestForm";
import {
  revokeCompanyMembershipAction,
  revokeInvestorMembershipAction,
  revokeCompanyInviteAction,
  revokeInvestorInviteAction,
  rejectAccessRequestAction,
} from "../actions";
import type { AccessData, AccessOrgDTO, AccessRequestDTO } from "@/lib/access/dto";

interface OrgListProps {
  listId: string;
  orgs: AccessOrgDTO[];
  canRevoke: boolean;
  revokeMember: (formData: FormData) => Promise<void>;
  revokeInvite: (formData: FormData) => Promise<void>;
}

function OrgList({ listId, orgs, canRevoke, revokeMember, revokeInvite }: OrgListProps) {
  const { t, lang } = useLanguage();
  const name = (o: AccessOrgDTO) => (lang === "ar" ? o.nameAr : o.nameEn);
  const { visible, controls, empty } = useListView(orgs, {
    id: listId,
    searchText: (o) => [o.nameEn, o.nameAr, ...o.members.map((m) => m.email), ...o.invites.map((i) => i.email)].join(" "),
    sorts: [
      byText("nameAsc", t.lists.nameAsc, name),
      byText("nameDesc", t.lists.nameDesc, name, true),
    ],
  });

  if (orgs.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.access.noOrgs}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {controls}
      {empty}
      {visible.map((org) => (
        <details key={org.id} className="chamfer-br-md bg-surface shadow-[var(--inner-line)]">
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

function PendingRequestsList({ requests, canRevoke }: { requests: AccessRequestDTO[]; canRevoke: boolean }) {
  const { t, lang } = useLanguage();
  const { visible, controls, empty } = useListView(requests, {
    id: "access-requests",
    searchText: (r) => `${r.email} ${r.organizationName ?? ""} ${t.signUp.roleOptions[r.requestedRole]} ${r.message ?? ""}`,
    sorts: [
      byValue("newest", t.lists.newestFirst, (r) => r.createdAt, true),
      byValue("oldest", t.lists.oldestFirst, (r) => r.createdAt),
      byText("emailAsc", t.lists.emailAsc, (r) => r.email),
    ],
  });

  if (requests.length === 0) {
    return <p className="text-sm text-muted-foreground">{t.access.noPendingRequests}</p>;
  }

  return (
    <div className="flex flex-col gap-2">
      {controls}
      {empty}
      {visible.map((req) => (
        <div key={req.id} className="chamfer-br-md flex flex-col gap-3 bg-surface p-4 shadow-[var(--inner-line)]">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="min-w-0 break-all text-sm font-medium text-foreground">{req.email}</span>
            <span className="text-xs text-muted-foreground">
              {t.access.requestedLabel}: {t.signUp.roleOptions[req.requestedRole]} ·{" "}
              <time dateTime={req.createdAt}>{formatDate(req.createdAt, lang)}</time>
            </span>
          </div>
          {req.organizationName ? (
            <p className="text-xs text-muted-foreground">
              {t.access.organizationRequestedLabel}: {req.organizationName}
            </p>
          ) : null}
          {req.message ? (
            <p className="text-xs text-muted-foreground">
              {t.access.messageLabel}: {req.message}
            </p>
          ) : null}

          {canRevoke ? (
            <div className="flex flex-wrap items-end gap-3">
              <ApproveRequestForm requestId={req.id} requestedRole={req.requestedRole} organizationName={req.organizationName} />
              <RevokeButton
                action={rejectAccessRequestAction}
                fieldName="requestId"
                id={req.id}
                label={t.access.rejectAction}
                confirmMessage={t.access.confirmReject.replace("{email}", req.email)}
              />
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

export function AccessClient({
  companies,
  investors,
  pendingRequests,
  canRevoke,
  staff,
}: AccessData & { staff: StaffUserRow[] | null }) {
  const { t } = useLanguage();

  return (
    <AppShell title={t.nav.access} subtitle={t.access.subtitle}>
      <div className="space-y-6">
        {!canRevoke ? <p className="text-sm text-muted-foreground">{t.access.viewOnlyNote}</p> : null}

        {staff ? (
          <section aria-labelledby="access-staff" className="space-y-3">
            <h2 id="access-staff" className="font-heading text-sm font-semibold text-foreground">
              {t.admin.manage.manageStaffTitle}
            </h2>
            <div className="chamfer-br-md space-y-6 bg-surface p-5 shadow-[var(--inner-line)]">
              <div className="space-y-2">
                <h3 className="text-xs font-semibold text-muted-foreground">{t.admin.manage.inviteStaffTitle}</h3>
                <InviteStaffUserForm />
              </div>
              <div className="overflow-x-auto">
                <StaffUsersTable rows={staff} />
              </div>
            </div>
          </section>
        ) : null}

        <section aria-labelledby="access-pending-requests" className="space-y-3">
          <h2 id="access-pending-requests" className="font-heading text-sm font-semibold text-foreground">
            {t.access.pendingRequestsTitle}
          </h2>
          <PendingRequestsList requests={pendingRequests} canRevoke={canRevoke} />
        </section>

        <section aria-labelledby="access-companies" className="space-y-3">
          <h2 id="access-companies" className="font-heading text-sm font-semibold text-foreground">
            {t.access.companiesTitle}
          </h2>
          <OrgList
            listId="access-companies"
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
            listId="access-investors"
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
