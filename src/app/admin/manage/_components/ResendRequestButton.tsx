"use client";

import { useForm } from "@/components/forms/useForm";
import { Button } from "@/components/ui/Button";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { resendReportRequestAction } from "../../actions";
import { initialActionState, FormMessage } from "./shared";

/** Emails a sent reporting request again to every startup in it that hasn't submitted. */
export function ResendRequestButton({ templateId, periodStart, periodEnd }: { templateId: string; periodStart: string; periodEnd: string }) {
  const { t } = useLanguage();
  const { state, isPending, formProps } = useForm(resendReportRequestAction, initialActionState);
  return (
    <form {...formProps} className="flex flex-col items-end gap-1">
      <input type="hidden" name="templateId" value={templateId} />
      <input type="hidden" name="periodStart" value={periodStart} />
      <input type="hidden" name="periodEnd" value={periodEnd} />
      <Button type="submit" variant="outline" size="xs" disabled={isPending}>
        {t.admin.manage.emailAgainAction}
      </Button>
      <div className="max-w-md text-end">
        <FormMessage state={state} />
      </div>
    </form>
  );
}
