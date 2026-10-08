"use client";

import { useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { Textarea } from "@/components/ui/Textarea";
import { createVehicleAction, updateVehicleAction, type ActionState } from "../../actions";
import { labelClass, fieldClass, FormMessage, FieldError, fieldA11y, invalidClass, prefill, useEntityForm } from "./shared";
import { slugify } from "@/lib/slugify";

export interface VehicleFormValues {
  id: string;
  slug: string;
  nameEn: string;
  nameAr: string;
  type: string;
  currency: string;
  vintageYear: string;
  department: string;
  descriptionEn: string;
  descriptionAr: string;
}

/** Create a vehicle, or edit an existing one when `vehicle` is given. */
export function CreateVehicleForm({ vehicle }: { vehicle?: VehicleFormValues }) {
  const { t } = useLanguage();
  const { state, formAction, isPending, formRef, formKey } = useEntityForm(vehicle ? updateVehicleAction : createVehicleAction);
  return (
    <VehicleFields
      key={formKey}
      state={state}
      vehicle={vehicle}
      formAction={formAction}
      formRef={formRef}
      isPending={isPending}
      submitLabel={vehicle ? t.admin.manage.saveChangesLabel : t.admin.manage.submitLabel}
    />
  );
}

function VehicleFields({
  state,
  vehicle,
  formAction,
  formRef,
  isPending,
  submitLabel,
}: {
  state: ActionState;
  vehicle?: VehicleFormValues;
  formAction: (formData: FormData) => void;
  formRef: React.RefObject<HTMLFormElement | null>;
  isPending: boolean;
  submitLabel: string;
}) {
  const { t } = useLanguage();
  const saved = vehicle as unknown as Record<string, string> | undefined;
  const value = (name: string) => prefill(state, saved, name);
  const [slug, setSlug] = useState(value("slug"));
  const [slugTouched, setSlugTouched] = useState(Boolean(vehicle) || value("slug") !== "");

  const field = (id: string, name: string) => ({ id, name, ...fieldA11y(state, id, name), className: invalidClass });

  return (
    <form ref={formRef} action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      {vehicle ? <input type="hidden" name="vehicleId" value={vehicle.id} /> : null}
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input
          {...field("v-nameEn", "nameEn")}
          defaultValue={value("nameEn")}
          required
          onBlur={(e) => {
            if (!slugTouched) setSlug(slugify(e.target.value));
          }}
        />
        <FieldError state={state} id="v-nameEn" name="nameEn" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input {...field("v-nameAr", "nameAr")} defaultValue={value("nameAr")} dir="rtl" required />
        <FieldError state={state} id="v-nameAr" name="nameAr" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-slug">{t.admin.manage.slugLabel}</label>
        <Input
          {...field("v-slug", "slug")}
          required
          value={slug}
          onChange={(e) => {
            setSlugTouched(true);
            setSlug(slugify(e.target.value));
          }}
        />
        <FieldError state={state} id="v-slug" name="slug" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-type">{t.admin.manage.typeLabel}</label>
        <Select {...field("v-type", "type")} required defaultValue={value("type")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="Fund">{t.vehicleTypes.Fund}</option>
          <option value="SPV">{t.vehicleTypes.SPV}</option>
        </Select>
        <FieldError state={state} id="v-type" name="type" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-currency">{t.admin.manage.currencyLabel}</label>
        <Select {...field("v-currency", "currency")} required defaultValue={value("currency")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
        <FieldError state={state} id="v-currency" name="currency" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-vintageYear">{t.admin.manage.vintageYearLabel}</label>
        <Input
          {...field("v-vintageYear", "vintageYear")}
          defaultValue={value("vintageYear")}
          type="number"
          min={1990}
          max={2100}
          step={1}
        />
        <FieldError state={state} id="v-vintageYear" name="vintageYear" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-department">{t.admin.manage.departmentLabel}</label>
        <Select {...field("v-department", "department")} required defaultValue={value("department")}>
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="VentureBuilder">{t.departments.VentureBuilder}</option>
          <option value="InvestmentDepartment">{t.departments.InvestmentDepartment}</option>
        </Select>
        <FieldError state={state} id="v-department" name="department" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-descriptionEn">{t.admin.manage.vehicleDescriptionEnLabel}</label>
        <Textarea {...field("v-descriptionEn", "descriptionEn")} defaultValue={value("descriptionEn")} rows={4} maxLength={2000} />
        <FieldError state={state} id="v-descriptionEn" name="descriptionEn" />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-descriptionAr">{t.admin.manage.vehicleDescriptionArLabel}</label>
        <Textarea {...field("v-descriptionAr", "descriptionAr")} defaultValue={value("descriptionAr")} rows={4} maxLength={2000} dir="rtl" />
        <FieldError state={state} id="v-descriptionAr" name="descriptionAr" />
      </div>
      <div className="sm:col-span-2">
        <FormMessage state={state} />
      </div>
      <Button type="submit" disabled={isPending} className="sm:col-span-2 sm:w-fit">
        {submitLabel}
      </Button>
    </form>
  );
}
