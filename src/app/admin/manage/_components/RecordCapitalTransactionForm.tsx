"use client";

import { useForm } from "@/components/forms/useForm";
import { useLanguage } from "@/lib/i18n/LanguageProvider";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Button } from "@/components/ui/Button";
import { recordInvestorCapitalTransactionAction } from "../../actions";
import { labelClass, fieldClass, initialActionState, FormMessage } from "./shared";
import type { AdminInvestorDTO, AdminVehicleDTO } from "@/lib/admin/dto";

const TRANSACTION_TYPES = ["CapitalCall", "Contribution", "Distribution", "ManagementFee"] as const;

interface RecordCapitalTransactionFormProps {
  investors: AdminInvestorDTO[];
  vehicles: AdminVehicleDTO[];
}

// Backfills the dated cash-flow history getInvestorReturns' IRR/MOIC
// calculation reads -- Falak needs to enter every real historical
// capital call/contribution/distribution/management fee here for an
// investor's returns to mean anything; the code can't invent dates it
// was never given.
export function RecordCapitalTransactionForm({ investors, vehicles }: RecordCapitalTransactionFormProps) {
  const { t, lang } = useLanguage();
  const { state, isPending, errorFor, formProps } = useForm(recordInvestorCapitalTransactionAction, initialActionState);

  return (
    <form {...formProps} className="grid grid-cols-1 gap-3 sm:grid-cols-2">
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-investor">{t.admin.manage.investorLabel}</label>
        <Select id="ct-investor" name="investorId" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {investors.map((i) => (
            <option key={i.id} value={i.id}>{lang === "ar" ? i.nameAr : i.nameEn}</option>
          ))}
        </Select>
        {errorFor("investorId")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-vehicle">{t.admin.manage.vehicleLabel}</label>
        <Select id="ct-vehicle" name="vehicleId" defaultValue="">
          <option value="">{t.admin.manage.selectPlaceholder}</option>
          {vehicles.map((v) => (
            <option key={v.id} value={v.id}>{lang === "ar" ? v.nameAr : v.nameEn}</option>
          ))}
        </Select>
        {errorFor("vehicleId")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-type">{t.admin.manage.typeLabel}</label>
        <Select id="ct-type" name="type" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          {TRANSACTION_TYPES.map((tt) => (
            <option key={tt} value={tt}>{t.capitalTransactionTypes[tt]}</option>
          ))}
        </Select>
        {errorFor("type")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-date">{t.admin.manage.transactionDateLabel}</label>
        <Input id="ct-date" name="transactionDate" type="date" required />
        {errorFor("transactionDate")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-amount">{t.admin.manage.amountLabel}</label>
        <Input id="ct-amount" name="amount" inputMode="decimal" pattern="\d+(\.\d{1,4})?" required />
        {errorFor("amount")}
      </div>
      <div className={fieldClass}>
        <label className={labelClass} htmlFor="ct-currency">{t.admin.manage.currencyLabel}</label>
        <Select id="ct-currency" name="currency" required defaultValue="">
          <option value="" disabled>{t.admin.manage.selectPlaceholder}</option>
          <option value="SAR">{t.currencyNames.SAR}</option>
          <option value="USD">{t.currencyNames.USD}</option>
        </Select>
        {errorFor("currency")}
      </div>
      <div className="sm:col-span-2">
        <label className={labelClass} htmlFor="ct-description">{t.admin.manage.descriptionLabel}</label>
        <Input id="ct-description" name="description" type="text" />
        {errorFor("description")}
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
