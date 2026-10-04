"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createCompanyAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import { slugify } from "@/lib/slugify";

export function CreateCompanyForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialActionState);
  const [slug, setSlug] = useState("");
  // Once the admin edits the slug themselves, stop overwriting it on
  // every nameEn keystroke -- auto-fill is a convenience for the common
  // case, never a fight against a deliberate manual edit.
  const [slugTouched, setSlugTouched] = useState(false);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input
          id="c-nameEn"
          name="nameEn"
          required
          onBlur={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="c-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-slug">{t.admin.manage.slugLabel}</label>
        <Input
          id="c-slug"
          name="slug"
          pattern="[a-z0-9]+(-[a-z0-9]+)*"
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-sectorEn">{t.admin.manage.sectorEnLabel}</label>
        <Input id="c-sectorEn" name="sectorEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-sectorAr">{t.admin.manage.sectorArLabel}</label>
        <Input id="c-sectorAr" name="sectorAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-customerModel">{t.admin.manage.customerModelLabel}</label>
        <Select id="c-customerModel" name="customerModel" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="B2B">{t.customerModels.B2B}</option>
          <option value="B2C">{t.customerModels.B2C}</option>
          <option value="B2B_B2C">{t.customerModels.B2B_B2C}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="c-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-entryStage">{t.admin.manage.entryStageLabel}</label>
        <Select id="c-entryStage" name="entryStage" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {(["PreSeed", "Seed", "SeriesA", "SeriesB", "Later"] as const).map((s) => (
            <option key={s} value={s}>{t.stages[s]}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-currentStage">{t.admin.manage.currentStageLabel}</label>
        <Select id="c-currentStage" name="currentStage" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {(["PreSeed", "Seed", "SeriesA", "SeriesB", "Later"] as const).map((s) => (
            <option key={s} value={s}>{t.stages[s]}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-department">{t.admin.manage.departmentLabel}</label>
        <Select id="c-department" name="department" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="VentureBuilder">{t.departments.VentureBuilder}</option>
          <option value="InvestmentDepartment">{t.departments.InvestmentDepartment}</option>
        </Select>
      </div>
      <fieldset className="sm:col-span-2">
        <legend className={labelClass}>{t.admin.manage.revenueModelsLabel}</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {(["SaaS", "Marketplace", "ECommerce", "TransactionBased", "Subscription", "Other"] as const).map((m) => (
            <label key={m} className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <input type="checkbox" name="revenueModels" value={m} />
              {t.revenueModels[m]}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}
