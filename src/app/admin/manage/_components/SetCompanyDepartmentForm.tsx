"use client";

import { useForm } from "@/components/forms/useForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { setCompanyDepartmentAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminCompanyDTO } from "@/lib/admin/dto";

export function SetCompanyDepartmentForm({ companies }: { companies: AdminCompanyDTO[] }) {
  const { t, lang } = useLanguage();
  const { state, isPending, errorFor, formProps } = useForm(setCompanyDepartmentAction, initialActionState);

  return (
    <form {...formProps} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="sd-company">{t.admin.manage.companyLabel}</label>
        <Select id="sd-company" name="companyId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</option>
          ))}
        </Select>
        {errorFor("companyId")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="sd-department">{t.admin.manage.departmentLabel}</label>
        <Select id="sd-department" name="department" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="VentureBuilder">{t.departments.VentureBuilder}</option>
          <option value="InvestmentDepartment">{t.departments.InvestmentDepartment}</option>
        </Select>
        {errorFor("department")}
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
