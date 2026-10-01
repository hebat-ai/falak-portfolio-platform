"use client";

import { useActionState, useState } from "react";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import {
  createCompanyAction,
  createVehicleAction,
  createInvestorAction,
  archiveVehicleAction,
  archiveInvestorAction,
  linkVehicleToCompanyAction,
  createReportingTemplateAction,
  createReportingCycleAction,
  createCompanyInviteAction,
  createInvestorInviteAction,
  type ActionState,
  type InviteActionState,
} from "../actions";
import type { AdminCompanyDTO, AdminVehicleDTO, AdminInvestorDTO, AdminReportingTemplateDTO } from "@/lib/admin/dto";

const labelClass = "text-xs font-medium text-muted-foreground";
const fieldClass = "flex flex-col gap-1";

const initialActionState: ActionState = { error: null };
const initialInviteState: InviteActionState = { error: null };

function FormMessage({ state }: { state: ActionState }) {
  const { t } = useLanguage();
  if (state.error) {
    return (
      <p role="alert" className="text-xs font-medium text-foreground">
        {state.error}
      </p>
    );
  }
  if (state.success) {
    return <p className="text-xs font-medium text-nebula-aqua">{t.admin.manage.successMessage}</p>;
  }
  return null;
}

function CreateCompanyForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createCompanyAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input id="c-nameEn" name="nameEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="c-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="c-slug">{t.admin.manage.slugLabel}</label>
        <Input id="c-slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
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

function CreateVehicleForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createVehicleAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input id="v-nameEn" name="nameEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="v-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-slug">{t.admin.manage.slugLabel}</label>
        <Input id="v-slug" name="slug" pattern="[a-z0-9]+(-[a-z0-9]+)*" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-type">{t.admin.manage.typeLabel}</label>
        <Select id="v-type" name="type" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="Fund">{t.vehicleTypes.Fund}</option>
          <option value="SPV">{t.vehicleTypes.SPV}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="v-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="v-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
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

function CreateInvestorForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createInvestorAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-nameEn">{t.admin.manage.nameEnLabel}</label>
        <Input id="i-nameEn" name="nameEn" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-nameAr">{t.admin.manage.nameArLabel}</label>
        <Input id="i-nameAr" name="nameAr" dir="rtl" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="i-type">{t.admin.manage.typeLabel}</label>
        <Select id="i-type" name="type" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="Institutional">{t.investorTypes.Institutional}</option>
          <option value="FamilyOffice">{t.investorTypes.FamilyOffice}</option>
          <option value="Individual">{t.investorTypes.Individual}</option>
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

function ArchivableList({
  items,
  action,
  fieldName,
}: {
  items: { id: string; nameEn: string; nameAr: string; archivedAt: string | null }[];
  action: (formData: FormData) => Promise<void>;
  fieldName: string;
}) {
  const { t, lang } = useLanguage();
  const active = items.filter((i) => !i.archivedAt);

  if (active.length === 0) {
    return <p className="text-xs text-muted-foreground">{t.admin.emptyState}</p>;
  }

  return (
    <ul className="chamfer-br-md divide-y divide-border-subtle shadow-[var(--inner-line)]">
      {active.map((item) => (
        <li key={item.id} className="flex items-center justify-between gap-3 px-3 py-2">
          <span className="text-sm text-foreground">{lang === "ar" ? item.nameAr : item.nameEn}</span>
          <form action={action}>
            <input type="hidden" name={fieldName} value={item.id} />
            <Button type="submit" variant="outline" size="xs">
              {t.admin.manage.archiveAction}
            </Button>
          </form>
        </li>
      ))}
    </ul>
  );
}

function LinkVehicleToCompanyForm({ companies, vehicles }: { companies: AdminCompanyDTO[]; vehicles: AdminVehicleDTO[] }) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(linkVehicleToCompanyAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-company">{t.admin.manage.companyLabel}</label>
        <Select id="l-company" name="companyId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="l-vehicle" name="vehicleId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-amount">{t.admin.manage.investedAmountLabel}</label>
        <Input id="l-amount" name="investedAmount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="l-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-pct">{t.admin.manage.ownershipPctLabel}</label>
        <Input id="l-pct" name="ownershipPct" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="l-date">{t.admin.manage.signedDateLabel}</label>
        <Input id="l-date" name="signedDate" type="date" required />
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

const METRIC_DATA_TYPES = ["Currency", "Percent", "Number", "Text", "Boolean"] as const;

function CreateReportingTemplateForm() {
  const { t } = useLanguage();
  const [state, formAction, isPending] = useActionState(createReportingTemplateAction, initialActionState);
  const [metricRowCount, setMetricRowCount] = useState(3);

  return (
    <form action={formAction} noValidate className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameEn">{t.admin.manage.nameEnLabel}</label>
          <Input id="tpl-nameEn" name="nameEn" required />
        </div>
        <div className={fieldClass}>
          <label className={labelClass} htmlFor="tpl-nameAr">{t.admin.manage.nameArLabel}</label>
          <Input id="tpl-nameAr" name="nameAr" dir="rtl" required />
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {Array.from({ length: metricRowCount }, (_, i) => (
          <div key={i} className="chamfer-br-sm grid grid-cols-1 gap-2 p-3 shadow-[var(--inner-line)] sm:grid-cols-4">
            <Input name={`metricKey_${i}`} placeholder={t.admin.manage.metricKeyLabel} />
            <Input name={`metricLabelEn_${i}`} placeholder={t.admin.manage.metricLabelEnLabel} />
            <Input name={`metricLabelAr_${i}`} dir="rtl" placeholder={t.admin.manage.metricLabelArLabel} />
            <Select name={`metricDataType_${i}`} defaultValue="">
              <option value="" disabled>{t.admin.manage.metricDataTypeLabel}</option>
              {METRIC_DATA_TYPES.map((dt) => (
                <option key={dt} value={dt}>{dt}</option>
              ))}
            </Select>
          </div>
        ))}
      </div>
      <Button type="button" variant="outline" className="w-fit" onClick={() => setMetricRowCount((n) => n + 1)}>
        {t.admin.manage.addMetricAction}
      </Button>

      <FormMessage state={state} />
      <Button type="submit" disabled={isPending} className="w-fit">
        {t.admin.manage.submitLabel}
      </Button>
    </form>
  );
}

function CreateReportingCycleForm({
  companies,
  templates,
}: {
  companies: AdminCompanyDTO[];
  templates: AdminReportingTemplateDTO[];
}) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(createReportingCycleAction, initialActionState);

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-company">{t.admin.manage.companyLabel}</label>
        <Select id="cy-company" name="companyId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {companies.map((c) => (
            <option key={c.id} value={c.id}>{lang === "ar" ? c.nameAr : c.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-template">{t.admin.manage.templateLabel}</label>
        <Select id="cy-template" name="templateId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {templates.map((tpl) => (
            <option key={tpl.id} value={tpl.id}>{lang === "ar" ? tpl.nameAr : tpl.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-label">{t.admin.manage.periodLabelLabel}</label>
        <Input id="cy-label" name="periodLabel" required />
      </div>
      <div />
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-start">{t.admin.manage.periodStartLabel}</label>
        <Input id="cy-start" name="periodStart" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-end">{t.admin.manage.periodEndLabel}</label>
        <Input id="cy-end" name="periodEnd" type="date" required />
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="cy-deadline">{t.admin.manage.deadlineLabel}</label>
        <Input id="cy-deadline" name="deadline" type="date" required />
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

// Shared by the company and investor invite forms: pick an organization,
// enter an email, and get a one-time link to copy.
interface InviteFormProps {
  action: (prevState: InviteActionState, formData: FormData) => Promise<InviteActionState>;
  idPrefix: string;
  selectName: "companyId" | "investorId";
  selectLabel: string;
  options: { id: string; nameEn: string; nameAr: string }[];
}

function InviteForm({ action, idPrefix, selectName, selectLabel, options }: InviteFormProps) {
  const { t, lang } = useLanguage();
  const [state, formAction, isPending] = useActionState(action, initialInviteState);
  const [copied, setCopied] = useState(false);
  const fullUrl = state.inviteUrl && typeof window !== "undefined" ? `${window.location.origin}${state.inviteUrl}` : state.inviteUrl;

  return (
    <form action={formAction} noValidate className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-org`}>{selectLabel}</label>
        <Select id={`${idPrefix}-org`} name={selectName} required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {options.map((o) => (
            <option key={o.id} value={o.id}>{lang === "ar" ? o.nameAr : o.nameEn}</option>
          ))}
        </Select>
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor={`${idPrefix}-email`}>{t.admin.manage.emailLabel}</label>
        <Input id={`${idPrefix}-email`} name="email" type="email" required />
      </div>
      <div className="sm:col-span-2">
        {state.error ? (
          <p role="alert" className="text-xs font-medium text-foreground">{state.error}</p>
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

interface ManagePanelProps {
  companies: AdminCompanyDTO[];
  vehicles: AdminVehicleDTO[];
  investors: AdminInvestorDTO[];
  templates: AdminReportingTemplateDTO[];
}

export function ManagePanel({ companies, vehicles, investors, templates }: ManagePanelProps) {
  const { t } = useLanguage();

  return (
    <section className="chamfer-br-md flex flex-col gap-6 bg-surface p-4 shadow-[var(--inner-line)]">
      <h2 className="font-heading text-sm font-semibold text-foreground">{t.admin.manage.sectionTitle}</h2>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createCompanyTitle}</h3>
          <CreateCompanyForm />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createVehicleTitle}</h3>
            <CreateVehicleForm />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground">{t.admin.manage.vehiclesListTitle}</h4>
            <ArchivableList items={vehicles} action={archiveVehicleAction} fieldName="vehicleId" />
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createInvestorTitle}</h3>
            <CreateInvestorForm />
          </div>
          <div className="flex flex-col gap-2">
            <h4 className="text-xs font-semibold text-muted-foreground">{t.admin.manage.investorsListTitle}</h4>
            <ArchivableList items={investors} action={archiveInvestorAction} fieldName="investorId" />
          </div>
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.linkVehicleTitle}</h3>
          <LinkVehicleToCompanyForm companies={companies} vehicles={vehicles} />
        </div>

        <div className="flex flex-col gap-2 lg:col-span-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createTemplateTitle}</h3>
          <CreateReportingTemplateForm />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createCycleTitle}</h3>
          <CreateReportingCycleForm companies={companies} templates={templates} />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createInviteTitle}</h3>
          <InviteForm
            action={createCompanyInviteAction}
            idPrefix="inv-company"
            selectName="companyId"
            selectLabel={t.admin.manage.companyLabel}
            options={companies}
          />
        </div>

        <div className="flex flex-col gap-2">
          <h3 className="text-sm font-semibold text-foreground">{t.admin.manage.createInvestorInviteTitle}</h3>
          <InviteForm
            action={createInvestorInviteAction}
            idPrefix="inv-investor"
            selectName="investorId"
            selectLabel={t.admin.manage.investorLabel}
            options={investors.filter((i) => !i.archivedAt)}
          />
        </div>
      </div>
    </section>
  );
}
