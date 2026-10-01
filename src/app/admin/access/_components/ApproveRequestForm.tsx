"use client";

import { useState } from "react";
import { Select } from "@/components/ui/Select";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { approveAccessRequestAction } from "../actions";
import type { AccessRequestedRole } from "@/generated/prisma/client";

type Grant = "FALAK_ADMIN" | "FALAK_OPERATIONS" | "INVESTOR";

// Suggests the natural mapping agreed for this feature (Management ->
// FALAK_ADMIN, Investment Professional -> FALAK_OPERATIONS, Investor ->
// INVESTOR) as the default, but the admin can still change it before
// submitting -- the requested role is only ever a suggestion, never
// auto-granted.
function defaultGrantFor(requestedRole: AccessRequestedRole): Grant {
  if (requestedRole === "MANAGEMENT") return "FALAK_ADMIN";
  if (requestedRole === "INVESTMENT_PROFESSIONAL") return "FALAK_OPERATIONS";
  return "INVESTOR";
}

interface ApproveRequestFormProps {
  requestId: string;
  requestedRole: AccessRequestedRole;
  organizationName: string | null;
}

export function ApproveRequestForm({ requestId, requestedRole, organizationName }: ApproveRequestFormProps) {
  const { t } = useLanguage();
  const [grant, setGrant] = useState<Grant>(defaultGrantFor(requestedRole));

  return (
    <form action={approveAccessRequestAction} className="flex flex-wrap items-end gap-2">
      <input type="hidden" name="requestId" value={requestId} />
      <div className="flex flex-col gap-1">
        <label htmlFor={`grant-${requestId}`} className="text-xs font-medium text-muted-foreground">
          {t.access.approveGrantLabel}
        </label>
        <Select id={`grant-${requestId}`} name="grant" value={grant} onChange={(e) => setGrant(e.target.value as Grant)}>
          <option value="FALAK_ADMIN">{t.signUp.roleOptions.MANAGEMENT}</option>
          <option value="FALAK_OPERATIONS">{t.signUp.roleOptions.INVESTMENT_PROFESSIONAL}</option>
          <option value="INVESTOR">{t.signUp.roleOptions.INVESTOR}</option>
        </Select>
      </div>

      {grant === "INVESTOR" ? (
        <div className="flex flex-col gap-1">
          <label htmlFor={`org-${requestId}`} className="text-xs font-medium text-muted-foreground">
            {t.access.approveOrgLabel}
          </label>
          <Input id={`org-${requestId}`} name="organizationName" type="text" defaultValue={organizationName ?? ""} required />
        </div>
      ) : null}

      <Button type="submit" size="xs">
        {t.access.approveAction}
      </Button>
    </form>
  );
}
