import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeVehicleDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/lib/vehicle/queries.ts -- and
// (transitively, unmodified) src/lib/auth/authorization.ts via
// tests/support/mock-loader.mjs.
const { getVehicleDirectoryData, getVehicleDashboardData } = await import("../src/lib/vehicle/queries.ts");
const { UnauthenticatedError, ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const OPERATIONS_ROLE = [{ role: "FALAK_OPERATIONS" }];

const INVESTOR_A = { id: "inv_a", nameEn: "Investor A", nameAr: "أ", type: "Institutional" };
const INVESTOR_B = { id: "inv_b", nameEn: "Investor B", nameAr: "ب", type: "Individual" };

function cycle(periodLabel: string, start: string, end: string, status: string, revenue: number | null) {
  return {
    id: `cycle_${periodLabel}`,
    periodLabel,
    periodStart: new Date(start),
    periodEnd: new Date(end),
    currentDeadline: new Date(end),
    submission: { id: `sub_${periodLabel}`, status, updatedAt: new Date(end), revenue },
  };
}

const Q1 = (status: string, revenue: number | null) => cycle("Q1 2026", "2026-01-01", "2026-03-31", status, revenue);
const Q2 = (status: string, revenue: number | null) => cycle("Q2 2026", "2026-04-01", "2026-06-30", status, revenue);

test("directory: unauthenticated caller is denied", async () => {
  setCurrentUser(null);
  setDbStub(makeVehicleDbStub({}));
  await assert.rejects(() => getVehicleDirectoryData(), UnauthenticatedError);
});

test("directory: authenticated non-Falak caller is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleDbStub({ falakRoles: [] }));
  await assert.rejects(() => getVehicleDirectoryData(), ForbiddenError);
});

test("directory: archived vehicles excluded; counts are distinct and skip archived/exited", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          companies: [
            { id: "co_1", slug: "co-1", nameEn: "Co 1" },
            { id: "co_1", slug: "co-1", nameEn: "Co 1" },
            { id: "co_2", slug: "co-2", nameEn: "Co 2", archived: true },
          ],
          investorPositions: [
            { investor: INVESTOR_A, status: "Active" },
            { investor: INVESTOR_A, status: "Active" },
            { investor: INVESTOR_B, status: "Exited" },
          ],
        },
        { id: "veh_2", slug: "old-fund", nameEn: "Old Fund", archived: true },
      ],
    })
  );
  const result = await getVehicleDirectoryData();
  assert.equal(result.length, 1);
  assert.equal(result[0].slug, "fund-one");
  assert.equal(result[0].companyCount, 1);
  assert.equal(result[0].investorCount, 1);
});

test("dashboard: unauthenticated caller is denied", async () => {
  setCurrentUser(null);
  setDbStub(makeVehicleDbStub({}));
  await assert.rejects(() => getVehicleDashboardData("fund-one"), UnauthenticatedError);
});

test("dashboard: authenticated non-Falak caller is denied", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleDbStub({ falakRoles: [], vehicles: [{ id: "veh_1", slug: "fund-one", nameEn: "Fund One" }] }));
  await assert.rejects(() => getVehicleDashboardData("fund-one"), ForbiddenError);
});

test("dashboard: unknown slug returns null", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleDbStub({ falakRoles: OPERATIONS_ROLE, vehicles: [] }));
  assert.equal(await getVehicleDashboardData("nope"), null);
});

test("dashboard: investor with two Active positions appears once; Exited and archived investors excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          investorPositions: [
            { investor: INVESTOR_A, status: "Active" },
            { investor: INVESTOR_A, status: "Active" },
            { investor: INVESTOR_B, status: "Exited" },
            { investor: { ...INVESTOR_B, id: "inv_c" }, status: "Active", investorArchived: true },
          ],
        },
      ],
    })
  );
  const result = await getVehicleDashboardData("fund-one");
  assert.deepEqual(
    result!.investors.map((i) => i.id),
    ["inv_a"]
  );
});

test("dashboard: archived linked company excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          companies: [
            { id: "co_1", slug: "co-1", nameEn: "Co 1", cycles: [Q1("approved", 100)] },
            { id: "co_2", slug: "co-2", nameEn: "Co 2", archived: true, cycles: [Q2("approved", 200)] },
          ],
        },
      ],
    })
  );
  const result = await getVehicleDashboardData("fund-one");
  assert.deepEqual(
    result!.companies.map((c) => c.id),
    ["co_1"]
  );
  // The archived company's Q2 cycle must not leak into the vehicle's periods either.
  assert.deepEqual(
    result!.periods.map((p) => p.key),
    ["Q1 2026"]
  );
});

test("dashboard: periods are the sorted union of linked companies' cycles only", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          companies: [
            { id: "co_1", slug: "co-1", nameEn: "Co 1", cycles: [Q2("submitted", null)] },
            { id: "co_2", slug: "co-2", nameEn: "Co 2", cycles: [Q1("approved", 50), Q2("approved", 60)] },
          ],
        },
        {
          id: "veh_2",
          slug: "fund-two",
          nameEn: "Fund Two",
          companies: [{ id: "co_3", slug: "co-3", nameEn: "Co 3", cycles: [cycle("Q3 2026", "2026-07-01", "2026-09-30", "draft", null)] }],
        },
      ],
    })
  );
  const result = await getVehicleDashboardData("fund-one");
  assert.deepEqual(
    result!.periods.map((p) => p.key),
    ["Q1 2026", "Q2 2026"]
  );
});

test("dashboard: a linked company with no cycle for a period gets a synthesized draft/null entry", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          companies: [
            { id: "co_1", slug: "co-1", nameEn: "Co 1", cycles: [Q2("approved", 100)] },
            { id: "co_2", slug: "co-2", nameEn: "Co 2", cycles: [Q1("approved", 50)] },
          ],
        },
      ],
    })
  );
  const result = await getVehicleDashboardData("fund-one");
  const co1 = result!.companies.find((c) => c.id === "co_1")!;
  assert.deepEqual(co1.periods["Q1 2026"], { status: "draft", revenue: null, lastUpdated: null, currentDeadline: null });
  assert.equal(co1.periods["Q2 2026"].status, "approved");
  assert.equal(co1.periods["Q2 2026"].revenue, 100);
});

test("dashboard: the same company linked twice appears once", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [
        {
          id: "veh_1",
          slug: "fund-one",
          nameEn: "Fund One",
          companies: [
            { id: "co_1", slug: "co-1", nameEn: "Co 1", cycles: [Q1("approved", 100)] },
            { id: "co_1", slug: "co-1", nameEn: "Co 1", cycles: [Q1("approved", 100)] },
          ],
        },
      ],
    })
  );
  const result = await getVehicleDashboardData("fund-one");
  assert.equal(result!.companies.length, 1);
});

test("dashboard: a vehicle outside an Operations user's department returns null, same as an unknown slug", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: OPERATIONS_ROLE,
      vehicles: [{ id: "veh_vb", slug: "vb-fund", nameEn: "VB Fund", department: "VentureBuilder" }],
    })
  );
  assert.equal(await getVehicleDashboardData("vb-fund"), null);
});

test("dashboard: Admin sees a vehicle in any department", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleDbStub({
      falakRoles: [{ role: "FALAK_ADMIN" }],
      vehicles: [{ id: "veh_vb", slug: "vb-fund", nameEn: "VB Fund", department: "VentureBuilder" }],
    })
  );
  const result = await getVehicleDashboardData("vb-fund");
  assert.equal(result!.vehicle.slug, "vb-fund");
});
