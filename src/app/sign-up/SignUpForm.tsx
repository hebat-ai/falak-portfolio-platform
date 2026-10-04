"use client";

import { useActionState, useState } from "react";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { submitAccessRequestAction, type SignUpState } from "./actions";
import type { AccessRequestedRole } from "@/generated/prisma/client";

const initialState: SignUpState = { error: null, sent: false };

export function SignUpForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(submitAccessRequestAction, initialState);
  const [role, setRole] = useState<AccessRequestedRole>("MANAGEMENT");

  if (state.sent) {
    return (
      <p role="status" className="text-sm text-foreground">
        {t.signUp.successMessage}
      </p>
    );
  }

  const errorMessage =
    state.error === "existing_account"
      ? t.signUp.existingAccountError
      : state.error === "already_pending"
        ? t.signUp.alreadyPendingError
        : state.error
          ? t.signUp.genericError
          : null;

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1">
        <label htmlFor="sign-up-email" className="text-xs font-medium text-muted-foreground">
          {t.signUp.emailLabel}
        </label>
        <Input id="sign-up-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-1">
        <label htmlFor="sign-up-role" className="text-xs font-medium text-muted-foreground">
          {t.signUp.roleLabel}
        </label>
        <Select
          id="sign-up-role"
          name="requestedRole"
          value={role}
          onChange={(e) => setRole(e.target.value as AccessRequestedRole)}
        >
          <option value="MANAGEMENT">{t.signUp.roleOptions.MANAGEMENT}</option>
          <option value="INVESTMENT_PROFESSIONAL">{t.signUp.roleOptions.INVESTMENT_PROFESSIONAL}</option>
          <option value="INVESTOR">{t.signUp.roleOptions.INVESTOR}</option>
        </Select>
      </div>

      {role === "INVESTOR" ? (
        <div className="space-y-1">
          <label htmlFor="sign-up-org" className="text-xs font-medium text-muted-foreground">
            {t.signUp.organizationLabel}
          </label>
          <Input id="sign-up-org" name="organizationName" type="text" autoComplete="organization" />
          <p className="text-xs text-muted-foreground">{t.signUp.organizationHint}</p>
        </div>
      ) : null}

      <div className="space-y-1">
        <label htmlFor="sign-up-message" className="text-xs font-medium text-muted-foreground">
          {t.signUp.messageLabel}
        </label>
        <Textarea id="sign-up-message" name="message" rows={3} />
      </div>

      {errorMessage ? (
        <p role="alert" className="text-xs font-semibold text-danger">
          {errorMessage}
        </p>
      ) : null}

      <Button type="submit" disabled={isPending}>
        {isPending ? t.signUp.submitting : t.signUp.submitAction}
      </Button>
    </form>
  );
}
