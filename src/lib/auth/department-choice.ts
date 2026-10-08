import type { Department } from "@/generated/prisma/client";

// A staff user's department setting as chosen in a form: one department,
// or -- Management only -- both. Stored as User.department plus
// User.allDepartments (see the schema).

/** Form value for "Both departments". */
export const ALL_DEPARTMENTS_VALUE = "all";

export const ALL_DEPARTMENTS: Department[] = ["VentureBuilder", "InvestmentDepartment"];

export interface DepartmentChoice {
  department: Department | null;
  allDepartments: boolean;
}

/**
 * The stored setting for a submitted department value, or null when it
 * isn't allowed: an unknown value, or "both" for someone who isn't
 * Management (Investment Professionals stay in one department).
 */
export function parseDepartmentChoice(value: string | null | undefined, isManagement: boolean): DepartmentChoice | null {
  if (value === ALL_DEPARTMENTS_VALUE) return isManagement ? { department: null, allDepartments: true } : null;
  const department = ALL_DEPARTMENTS.find((d) => d === value);
  return department ? { department, allDepartments: false } : null;
}

export const BOTH_DEPARTMENTS_MANAGEMENT_ONLY = "Both departments is only available to Management.";
