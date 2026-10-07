"use client";

import { useState } from "react";
import { useForm } from "@/components/forms/useForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { deleteCompanyAction, deleteVehicleAction } from "../../actions";
import { labelClass, initialActionState, FormMessage } from "./shared";

/** Permanent delete, confirmed by typing the record's exact English name. */
export function DeleteEntityForm({ kind, id, nameEn }: { kind: "company" | "vehicle"; id: string; nameEn: string }) {
  const { t } = useLanguage();
  const { state, isPending, errorFor, formProps } = useForm(
    kind === "company" ? deleteCompanyAction : deleteVehicleAction,
    initialActionState
  );
  const [typed, setTyped] = useState("");
  const matches = typed.trim() === nameEn.trim();

  return (
    <section id="delete" aria-labelledby="delete-heading" className="chamfer-br-md space-y-3 p-5 shadow-[inset_0_0_0_2px_var(--danger)]">
      <h2 id="delete-heading" className="font-heading text-sm font-semibold text-danger">
        {t.admin.manage.deleteSectionTitle}
      </h2>
      <p className="text-sm text-foreground">
        {kind === "company" ? t.admin.manage.deleteCompanyWarning : t.admin.manage.deleteVehicleWarning}
      </p>
      <form {...formProps} className="flex flex-col gap-3">
        <input type="hidden" name={kind === "company" ? "companyId" : "vehicleId"} value={id} />
        <div className="flex flex-col gap-1">
          <label className={labelClass} htmlFor="delete-confirm">
            {t.admin.manage.deleteConfirmLabel} <span className="font-semibold text-foreground">{nameEn}</span>
          </label>
          <Input
            id="delete-confirm"
            name="confirmName"
            autoComplete="off"
            className="sm:max-w-sm"
            value={typed}
            onChange={(e) => setTyped(e.target.value)}
          />
          {errorFor("confirmName")}
        </div>
        <FormMessage state={state} />
        <Button
          type="submit"
          disabled={!matches || isPending}
          className="w-fit bg-danger! text-white! hover:opacity-90 disabled:bg-border-subtle! disabled:text-muted-foreground!"
        >
          {t.admin.manage.deleteAction}
        </Button>
      </form>
    </section>
  );
}
