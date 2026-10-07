"use client";

import { useForm } from "@/components/forms/useForm";
import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import type { InviteActionState } from "../../actions";
import { labelClass, fieldClass } from "./shared";

const initialInviteState: InviteActionState = { error: null };

// Shared by the company and investor invite forms: pick an organization,
// enter an email, and get a one-time link to copy.
interface InviteFormProps {
  action: (prevState: InviteActionState, formData: FormData) => Promise<InviteActionState>;
  idPrefix: string;
  selectName: "companyId" | "investorId";
  selectLabel: string;
  options: { id: string; nameEn: string; nameAr: string }[];
}

export function InviteForm({ action, idPrefix, selectName, selectLabel, options }: InviteFormProps) {
  const { t, lang } = useLanguage();
  const { state, isPending, errorFor, formProps } = useForm(action, initialInviteState);
  const [copied, setCopied] = useState(false);
  const fullUrl = state.inviteUrl && typeof window !== "undefined" ? `${window.location.origin}${state.inviteUrl}` : state.inviteUrl;

  return (
    <form {...formProps} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-org`}>{selectLabel}</label>
        <Select id={`${idPrefix}-org`} name={selectName} required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{lang === "ar" ? o.nameAr : o.nameEn}</option>
          ))}
        </Select>
        {errorFor(selectName)}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-email`}>{t.admin.manage.emailLabel}</label>
        <Input id={`${idPrefix}-email`} name="email" type="email" required />
        {errorFor("email")}
      </div>
      <div className="sm:col-span-2">
        {state.error ? (
          <p role="alert" className="text-xs font-semibold text-danger">{state.error}</p>
        ) : null}
        {fullUrl ? (
          <div className="chamfer-br-sm flex flex-col gap-2 bg-surface-muted p-3 shadow-[var(--inner-line)]">
            <p className="text-xs text-muted-foreground">{t.admin.manage.inviteCreatedMessage}</p>
            <div className="flex flex-wrap items-center gap-2">
              <code className="chamfer-br-sm break-all bg-surface px-2 py-1 text-xs text-foreground">{fullUrl}</code>
              <Button
                type="button"
                variant="outline"
                size="xs"
                onClick={() => {
                  navigator.clipboard.writeText(fullUrl).then(() => setCopied(true));
                }}
              >
                {copied ? t.admin.manage.linkCopiedMessage : t.admin.manage.copyLinkAction}
              </Button>
            </div>
          </div>
        ) : null}
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}
