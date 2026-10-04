import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getReportingRequests } = await import("../src/lib/admin/reporting-requests.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

function makeStub(options: {
  falakRoles?: typeof ADMIN_ROLE;
  cycles?: Record<string, unknown>[];
  reports?: Record<string, unknown>[];
}) {
  return {
    userRoleAssignment: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        const roleFilter = where.role as { in: string[] };
        return (options.falakRoles ?? []).filter((r) => roleFilter.in.includes(r.role)).map((r) => ({ role: r.role }));
      },
    },
    reportingCycle: {
      findMany: async () => options.cycles ?? [],
    },
    report: {
      findMany: async () => options.reports ?? [],
    },
  };
}

const BASE_CYCLE = {
  id: "cycle_1",
  periodLabel: "Q1 2026",
  periodStart: new Date("2026-01-01"),
  periodEnd: new Date("2026-03-31"),
  currentDeadline: new Date("2026-04-15"),
  status: "Open",
  openedAt: new Date("2025-12-20"),
  company: {
    id: "co_1",
    slug: "acme",
    nameEn: "Acme",
    nameAr: "Acme AR",
    ownershipPositions: [{ vehicle: { id: "veh_1", slug: "fund-i", nameEn: "Fund I", nameAr: "Fund I AR" } }],
  },
  template: { nameEn: "Standard", nameAr: "قياسي" },
  submission: { id: "sub_1", status: "submitted" },
};

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeStub({ falakRoles: [] }));
  await assert.rejects(() => getReportingRequests(), ForbiddenError);
});

test("no cycles -> empty list, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeStub({ falakRoles: ADMIN_ROLE, cycles: [] }));
  const result = await getReportingRequests();
  assert.deepEqual(result, []);
});

test("a cycle with no published report yet has isPublished false and no distribution summary", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeStub({ falakRoles: ADMIN_ROLE, cycles: [BASE_CYCLE], reports: [] }));
  const result = await getReportingRequests();
  assert.equal(result.length, 1);
  assert.equal(result[0].isPublished, false);
  assert.equal(result[0].distribution, null);
  assert.equal(result[0].vehicles.length, 1);
  assert.equal(result[0].vehicles[0].id, "veh_1");
});

test("a cycle with a matching published report gets isPublished true and a sent/pending/failed tally", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeStub({
      falakRoles: ADMIN_ROLE,
      cycles: [BASE_CYCLE],
      reports: [
        {
          companyId: "co_1",
          periodStart: BASE_CYCLE.periodStart,
          periodEnd: BASE_CYCLE.periodEnd,
          versions: [
            {
              id: "version_1",
              distributions: [{ status: "Sent" }, { status: "Sent" }, { status: "Pending" }, { status: "Failed" }],
            },
          ],
        },
      ],
    })
  );
  const result = await getReportingRequests();
  assert.equal(result[0].isPublished, true);
  assert.equal(result[0].reportVersionId, "version_1");
  assert.deepEqual(result[0].distribution, { total: 4, sent: 2, pending: 1, failed: 1 });
});

test("a report for a DIFFERENT period never matches this cycle's period", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeStub({
      falakRoles: ADMIN_ROLE,
      cycles: [BASE_CYCLE],
      reports: [
        {
          companyId: "co_1",
          periodStart: new Date("2025-01-01"),
          periodEnd: new Date("2025-03-31"),
          versions: [{ id: "version_old", distributions: [] }],
        },
      ],
    })
  );
  const result = await getReportingRequests();
  assert.equal(result[0].isPublished, false);
});

test("a company linked to the same vehicle through two ownership positions lists that vehicle once", async () => {
  setCurrentUser(REAL_USER);
  const cycle = {
    ...BASE_CYCLE,
    company: {
      ...BASE_CYCLE.company,
      ownershipPositions: [
        { vehicle: { id: "veh_1", slug: "fund-i", nameEn: "Fund I", nameAr: "Fund I AR" } },
        { vehicle: { id: "veh_1", slug: "fund-i", nameEn: "Fund I", nameAr: "Fund I AR" } },
      ],
    },
  };
  setDbStub(makeStub({ falakRoles: ADMIN_ROLE, cycles: [cycle], reports: [] }));
  const result = await getReportingRequests();
  assert.equal(result[0].vehicles.length, 1);
});
