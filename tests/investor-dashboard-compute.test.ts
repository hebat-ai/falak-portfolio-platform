import { test } from "node:test";
import assert from "node:assert/strict";

const { computeSectorDistribution, computeInvestedCapital, computeInvestorNavSeries } = await import(
  "../src/lib/investor/dashboard-compute.ts"
);

function vehicle(overrides: Record<string, unknown>) {
  return {
    id: "veh",
    slug: "veh",
    nameEn: "Veh",
    nameAr: "Veh",
    type: "Fund",
    currency: "SAR",
    investorOrgId: "inv_1",
    linkedCompanies: [],
    contributions: [],
    ownershipShare: null,
    navHistory: [],
    ...overrides,
  } as never;
}

const co = (id: string, sector: string) => ({ id, slug: id, nameEn: id, nameAr: id, sectorEn: sector, sectorAr: `${sector}-ar` });

test("sector distribution counts each startup once, even if held by two vehicles", () => {
  const slices = computeSectorDistribution([
    vehicle({ id: "v1", linkedCompanies: [co("a", "Fintech"), co("b", "Fintech"), co("c", "Health")] }),
    vehicle({ id: "v2", linkedCompanies: [co("a", "Fintech")] }),
  ]);
  assert.deepEqual(
    slices.map((s) => [s.key, s.count, s.labelAr]),
    [
      ["Fintech", 2, "Fintech-ar"],
      ["Health", 1, "Health-ar"],
    ]
  );
});

test("sector distribution merges spellings that differ only in case or spacing", () => {
  const slices = computeSectorDistribution([
    vehicle({ id: "v1", linkedCompanies: [co("a", "HealthTech"), co("b", "Healthtech"), co("c", " health tech ")] }),
  ]);
  assert.deepEqual(
    slices.map((s) => [s.key, s.count]),
    [["HealthTech", 3]]
  );
});

test("invested capital sums contributions in the display currency", () => {
  const exposures = [
    vehicle({ contributions: [{ amount: 375_000, currency: "SAR" }] }),
    vehicle({ contributions: [{ amount: 100_000, currency: "USD" }] }),
  ];
  assert.equal(computeInvestedCapital(exposures, "USD"), 200_000);
  assert.equal(computeInvestedCapital(exposures, "SAR"), 750_000);
});

test("NAV series: share x each vehicle's latest NAV on or before each date, summed", () => {
  const series = computeInvestorNavSeries(
    [
      vehicle({
        id: "v1",
        ownershipShare: 0.5,
        navHistory: [
          { asOfDate: "2026-03-31", amount: 1_000, currency: "SAR" },
          { asOfDate: "2026-06-30", amount: 2_000, currency: "SAR" },
        ],
      }),
      // Marked only once, mid-way; carries forward to later dates.
      vehicle({ id: "v2", ownershipShare: 0.1, navHistory: [{ asOfDate: "2026-05-15", amount: 3_750, currency: "USD" }] }),
      // No share known -> excluded rather than guessed.
      vehicle({ id: "v3", ownershipShare: null, navHistory: [{ asOfDate: "2026-03-31", amount: 9_999, currency: "SAR" }] }),
    ],
    "SAR"
  );
  assert.deepEqual(series, [
    { asOfDate: "2026-03-31", value: 500 },
    { asOfDate: "2026-05-15", value: 500 + 0.1 * 3_750 * 3.75 },
    { asOfDate: "2026-06-30", value: 1_000 + 0.1 * 3_750 * 3.75 },
  ]);
});
