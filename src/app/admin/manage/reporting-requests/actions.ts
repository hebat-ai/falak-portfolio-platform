"use server";

import { staffSaveCycleValues } from "@/lib/reporting/staff-entry";
import type { MetricValueInput } from "@/lib/reporting/metrics";
import { isAuthError, GENERIC_ACCESS_DENIED } from "@/lib/auth/action-error";

export interface StaffEntryState {
  error: string | null;
  fieldErrors?: Record<string, string>;
  success: boolean;
  submitted?: boolean;
}

/**
 * Staff entering a startup's report figures for one reporting cycle.
 * Inputs follow the startup form's naming: `value_<metricDefinitionId>`
 * and the `na_<metricDefinitionId>` checkbox. The clicked button's
 * `intent` ("save" or "submit") decides whether it is also submitted for
 * review. cycleId only names the record; staffSaveCycleValues re-checks
 * the caller's role, department and the report's status itself.
 */
export async function staffEntryAction(cycleId: string, _prevState: StaffEntryState, formData: FormData): Promise<StaffEntryState> {
  const values: MetricValueInput[] = [];
  for (const key of formData.keys()) {
    if (!key.startsWith("value_")) continue;
    const metricDefinitionId = key.slice("value_".length);
    const rawValue = formData.get(key);
    values.push({
      metricDefinitionId,
      rawValue: typeof rawValue === "string" ? rawValue : "",
      isNa: formData.get(`na_${metricDefinitionId}`) !== null,
    });
  }

  try {
    const result = await staffSaveCycleValues(cycleId, values, formData.get("intent") === "submit");
    return result;
  } catch (error) {
    if (isAuthError(error)) return { error: GENERIC_ACCESS_DENIED, success: false };
    throw error;
  }
}
