import { test } from "node:test";
import assert from "node:assert/strict";

const { validateCompany, validateVehicle, validateInvestor } = await import("../src/lib/admin/entity-validation.ts");

function form(fields: Record<string, string | string[]>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) {
    for (const item of Array.isArray(v) ? v : [v]) fd.append(k, item);
  }
  return fd;
}

const GOOD_COMPANY = {
  slug: "startup-x",
  nameEn: "Startup X",
  nameAr: "ستارت أب",
  sectorEn: "Fintech",
  sectorAr: "تقنية مالية",
  customerModel: "B2B",
  currency: "SAR",
  entryStage: "Seed",
  currentStage: "SeriesA",
  department: "VentureBuilder",
  revenueModels: ["SaaS", "Marketplace"],
};

test("a valid company passes, with typed input", () => {
  const { errors, input } = validateCompany(form(GOOD_COMPANY), null);
  assert.deepEqual(errors, {});
  assert.deepEqual(input?.revenueModels, ["SaaS", "Marketplace"]);
});

test("only the bad company fields are flagged, and every submitted value comes back", () => {
  const { errors, input, values } = validateCompany(form({ ...GOOD_COMPANY, slug: "Startup X", currency: "" }), null);
  assert.equal(input, null);
  assert.deepEqual(Object.keys(errors).sort(), ["currency", "slug"]);
  assert.equal(values.nameEn, "Startup X");
  assert.equal(values.slug, "Startup X");
  assert.deepEqual(values.revenueModels, ["SaaS", "Marketplace"]);
});

test("a department outside the caller's scope is flagged on the department field", () => {
  const { errors } = validateCompany(form(GOOD_COMPANY), ["InvestmentDepartment"]);
  assert.deepEqual(Object.keys(errors), ["department"]);
});

test("vehicle: vintage year is optional but must be a sensible year", () => {
  const base = { slug: "fund-1", nameEn: "Fund 1", nameAr: "صندوق", type: "Fund", currency: "USD", department: "InvestmentDepartment" };
  assert.equal(validateVehicle(form({ ...base, vintageYear: "" }), null).input?.vintageYear, null);
  assert.equal(validateVehicle(form({ ...base, vintageYear: "2024" }), null).input?.vintageYear, 2024);
  assert.deepEqual(Object.keys(validateVehicle(form({ ...base, vintageYear: "24" }), null).errors), ["vintageYear"]);
});

test("investor: missing name and type are each flagged", () => {
  const { errors } = validateInvestor(form({ nameEn: "", nameAr: "LP", type: "", department: "VentureBuilder" }), null);
  assert.deepEqual(Object.keys(errors).sort(), ["nameEn", "type"]);
});
