"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { createCompanyAction, updateCompanyAction, type ActionState } from "../../actions";
import {
  labelClass,
  fieldClass,
  FormMessage,
  FieldError,
  fieldA11y,
  invalidClass,
  prefill,
  prefillList,
  useEntityForm,
} from "./shared";
import { slugify } from "@/lib/slugify";

export interface CompanyFormValues {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  sectorEn: string;
  sectorAr: string;
  customerModel: string;
  revenueModels: string[];
  currency: string;
  entryStage: string;
  currentStage: string;
  department: string;
}

const STAGES = ["PreSeed", "Seed", "SeriesA", "SeriesB", "Later"] as const;

/** Create a startup, or edit an existing one when `company` is given. */
export function CreateCompanyForm({ company }: { company?: CompanyFormValues }) {
  const { t } = useLanguage();
  const { state, formAction, isPending, formRef, formKey } = useEntityForm(company ? updateCompanyAction : createCompanyAction);
  return (
    <CompanyFields
      key={formKey}
      state={state}
      company={company}
      formAction={formAction}
      formRef={formRef}
      isPending={isPending}
      submitLabel={company ? t.admin.manage.saveChangesLabel : t.admin.manage.submitLabel}
    />
  );
}

function CompanyFields({
  state,
  company,
  formAction,
  formRef,
  isPending,
  submitLabel,
}: {
  state: ActionState;
  company?: CompanyFormValues;
  formAction: (formData: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  isPending: boolean;
  submitLabel: string;
}) {
  const { t } = useLanguage();
  const saved = company as unknown as Record<string, string | string[]> | undefined;
  const value = (name: string) => prefill(state, saved, name);
  const [slug, setSlug] = useState(value("slug"));
  // Auto-fill the slug from the English name only for a new company, and
  // only until the slug is edited by hand.
  const [slugTouched, setSlugTouched] = useState(Boolean(company) || value("slug") !== "");
  const revenueModels = prefillList(state, saved, "revenueModels");

  const field = (id: string, name: string) => ({ id, name, ...fieldA11y(state, id, name), className: invalidClass });

  return (
    <form ref={formRef} action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {company ? <input type="hidden" name="companyId" value={company.id} /> : null}
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input
          {...field("c-nameEn", "nameEn")}
          defaultValue={value("nameEn")}
          required
          onBlur={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <FieldError state={state} id="c-nameEn" name="nameEn" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input {...field("c-nameAr", "nameAr")} defaultValue={value("nameAr")} dir="rtl" required />
        <FieldError state={state} id="c-nameAr" name="nameAr" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-slug">{t.admin.manage.slugLabel}</label>
        <Input
          {...field("c-slug", "slug")}
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <FieldError state={state} id="c-slug" name="slug" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-sectorEn">{t.admin.manage.sectorEnLabel}</label>
        <Input {...field("c-sectorEn", "sectorEn")} defaultValue={value("sectorEn")} required />
        <FieldError state={state} id="c-sectorEn" name="sectorEn" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-sectorAr">{t.admin.manage.sectorArLabel}</label>
        <Input {...field("c-sectorAr", "sectorAr")} defaultValue={value("sectorAr")} dir="rtl" required />
        <FieldError state={state} id="c-sectorAr" name="sectorAr" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-customerModel">{t.admin.manage.customerModelLabel}</label>
        <Select {...field("c-customerModel", "customerModel")} required defaultValue={value("customerModel")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="B2B">{t.customerModels.B2B}</option>
          <option value="B2C">{t.customerModels.B2C}</option>
          <option value="B2B_B2C">{t.customerModels.B2B_B2C}</option>
        </Select>
        <FieldError state={state} id="c-customerModel" name="customerModel" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-currency">{t.admin.manage.currencyLabel}</label>
        <Select {...field("c-currency", "currency")} required defaultValue={value("currency")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
        <FieldError state={state} id="c-currency" name="currency" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-entryStage">{t.admin.manage.entryStageLabel}</label>
        <Select {...field("c-entryStage", "entryStage")} required defaultValue={value("entryStage")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{t.stages[s]}</option>
          ))}
        </Select>
        <FieldError state={state} id="c-entryStage" name="entryStage" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-currentStage">{t.admin.manage.currentStageLabel}</label>
        <Select {...field("c-currentStage", "currentStage")} required defaultValue={value("currentStage")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {STAGES.map((s) => (
            <option key={s} value={s}>{t.stages[s]}</option>
          ))}
        </Select>
        <FieldError state={state} id="c-currentStage" name="currentStage" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-department">{t.admin.manage.departmentLabel}</label>
        <Select {...field("c-department", "department")} required defaultValue={value("department")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="VentureBuilder">{t.departments.VentureBuilder}</option>
          <option value="InvestmentDepartment">{t.departments.InvestmentDepartment}</option>
        </Select>
        <FieldError state={state} id="c-department" name="department" />
      </div>
      <fieldset className="sm:col-span-2" aria-describedby={state.fieldErrors?.revenueModels ? "c-revenueModels-error" : undefined}>
        <legend className={labelClass}>{t.admin.manage.revenueModelsLabel}</legend>
        <div className="mt-1 flex flex-wrap gap-3">
          {(["SaaS", "Marketplace", "ECommerce", "TransactionBased", "Subscription", "Other"] as const).map((m) => (
            <label key={m} className="inline-flex items-center gap-1.5 text-sm text-foreground">
              <input type="checkbox" name="revenueModels" value={m} defaultChecked={revenueModels.includes(m)} />
              {t.revenueModels[m]}
            </label>
          ))}
        </div>
        <FieldError state={state} id="c-revenueModels" name="revenueModels" />
      </fieldset>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
