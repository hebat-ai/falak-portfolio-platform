"use client";

import { useLanguage } from "@/lib/i18n/LanguageProvider";
import type { ActionState } from "../../actions";

export const labelClass = "text-xs font-medium text-muted-foreground";
export const fieldClass = "flex flex-col gap-1";

export const initialActionState: ActionState = { error: null };

export function FormMessage({ state }: { state: ActionState }) {
  const { t } = useLanguage();
  if (state.error) {
    return (
      <p role="alert" className="text-xs font-semibold text-danger">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return <p className="text-xs font-medium text-nebula-aqua">{t.admin.manage.successMessage}</p>;
  }
  return null;
}
