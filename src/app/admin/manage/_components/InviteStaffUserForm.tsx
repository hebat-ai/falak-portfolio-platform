"use client";

import { useActionState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { inviteStaffUserAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";

// FALAK_ADMIN is deliberately never an option -- see
// inviteStaffUserAction's own comment on why granting the platform-
// owner tier stays a manual, out-of-band action.
export function InviteStaffUserForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(inviteStaffUserAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="staff-email">{t.admin.manage.emailLabel}</label>
        <Input id="staff-email" name="email" type="email" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="staff-role">{t.admin.manage.roleLabel}</label>
        <Select id="staff-role" name="role" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="FALAK_MANAGEMENT">{t.staffRoleNames.FALAK_MANAGEMENT}</option>
          <option value="FALAK_OPERATIONS">{t.staffRoleNames.FALAK_OPERATIONS}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="staff-department">{t.admin.manage.departmentLabel}</label>
        <Select id="staff-department" name="department" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="VentureBuilder">{t.departments.VentureBuilder}</option>
          <option value="InvestmentDepartment">{t.departments.InvestmentDepartment}</option>
        </Select>
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}
