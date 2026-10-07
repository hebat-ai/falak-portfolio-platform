"use client";

import { useActionState, useEffect, useRef } from "react";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { submitAccessRequestAction, type SignUpState } from "./actions";

const initialState: SignUpState = { error: null, sent: false };

// Public sign-up is for investors only -- Falak staff join through an
// Admin's invite on the Manage Staff page.
export function SignUpForm() {
  const { t } = useLanguage();
  // Recorded after mount and attached on submit, so a bot that posts the
  // form without running the page's JavaScript never sends it (see the
  // bot checks in ./actions). Not a form field, so it survives the form
  // reset React does after each submit.
  const startedAt = useRef(0);
  useEffect(() => {
    startedAt.current = Date.now();
  }, []);
  const [state, formAction, isPending] = useActionState((prev: SignUpState, formData: FormData) => {
    formData.set("formStartedAt", String(startedAt.current));
    return submitAccessRequestAction(prev, formData);
  }, initialState);

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
      <input type="hidden" name="requestedRole" value="INVESTOR" />
      {/* Hidden from people; form-filling bots fill it in. */}
      <div aria-hidden="true" className="absolute -left-[10000px] h-px w-px overflow-hidden">
        <label htmlFor="sign-up-website">Website</label>
        <input id="sign-up-website" name="website" type="text" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-1">
        <label htmlFor="sign-up-email" className="text-xs font-medium text-muted-foreground">
          {t.signUp.emailLabel}
        </label>
        <Input id="sign-up-email" name="email" type="email" autoComplete="email" required />
      </div>

      <div className="space-y-1">
        <label htmlFor="sign-up-org" className="text-xs font-medium text-muted-foreground">
          {t.signUp.organizationLabel}
        </label>
        <Input id="sign-up-org" name="organizationName" type="text" autoComplete="organization" />
        <p className="text-xs text-muted-foreground">{t.signUp.organizationHint}</p>
      </div>

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
