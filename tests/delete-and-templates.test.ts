import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub, REAL_USER } from "./support/stubs.ts";

const actions = await import("../src/app/admin/actions.ts");
const { GENERIC_ACCESS_DENIED } = await import("../src/lib/auth/action-error.ts");
const { MockRedirectError } = (await import("next/navigation")) as unknown as {
  MockRedirectError: new (url: string) => Error & { url: string };
};

const OPS = [{ role: "FALAK_OPERATIONS" }];
const ADMIN = [{ role: "FALAK_ADMIN" }];

/** A db stub where every model call is recorded; unknown models return empty results. */
function recordingDb(falakRoles: { role: string }[], overrides: Record<string, Record<string, (...args: never[]) => unknown>> = {}) {
  const calls: string[] = [];
  const base = makeAdminActionDbStub({ falakRoles, models: overrides }) as unknown as Record<string, unknown>;
  const passThrough = new Set(["userRoleAssignment", "user", "getAuditEvents", "$transaction"]);
  const db: Record<string, unknown> = new Proxy(base, {
    get(target, model: string) {
      if (passThrough.has(model)) return target[model];
      const real = (target[model] ?? {}) as Record<string, unknown>;
      return new Proxy(real, {
        get(inner, method: string) {
          return async (...args: unknown[]) => {
            calls.push(`${model}.${method}`);
            const fn = inner[method];
            if (typeof fn === "function") return (fn as (...a: unknown[]) => unknown)(...args);
            return method === "findMany" ? [] : { count: 0 };
          };
        },
      });
    },
  });
  base.$transaction = async (fn: (tx: unknown) => Promise<unknown>) => fn(db);
  return { db, calls };
}

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

const isRedirectTo = (url: string) => (e: unknown) => e instanceof MockRedirectError && e.url === url;

test("delete startup: an Investment Professional deletes a startup in their department, its history first", async () => {
  setCurrentUser(REAL_USER);
  const { db, calls } = recordingDb(OPS, {
    company: {
      findUnique: async () => ({ nameEn: "Startup X", slug: "startup-x", department: "InvestmentDepartment" }),
      delete: async () => ({}),
    },
  });
  setDbStub(db);
  await assert.rejects(
    () => actions.deleteCompanyAction({ error: null }, form({ companyId: "co_1", confirmName: "Startup X" })),
    isRedirectTo("/admin/manage/new-company")
  );
  const deleted = calls.indexOf("company.delete");
  assert.ok(deleted > 0, "startup deleted");
  for (const child of [
    "reportVersion.deleteMany",
    "companySubmission.deleteMany",
    "reportingCycle.deleteMany",
    "ownershipPosition.deleteMany",
    "companyValuationSnapshot.deleteMany",
    "companyMembership.deleteMany",
  ]) {
    const i = calls.indexOf(child);
    assert.ok(i >= 0 && i < deleted, `${child} runs before the startup is deleted`);
  }
  assert.ok(calls.indexOf("reportVersionSubmission.deleteMany") < calls.indexOf("companySubmission.deleteMany"));
  assert.ok(calls.includes("auditEvent.create"));
});

test("delete startup: refused for another department, or when the typed name does not match", async () => {
  setCurrentUser(REAL_USER);
  for (const [department, confirmName] of [
    ["VentureBuilder", "Startup X"],
    ["InvestmentDepartment", "startup x"],
  ]) {
    const { db, calls } = recordingDb(OPS, {
      company: { findUnique: async () => ({ nameEn: "Startup X", slug: "startup-x", department }) },
    });
    setDbStub(db);
    const result = await actions.deleteCompanyAction({ error: null }, form({ companyId: "co_1", confirmName }));
    assert.ok(result.error, `${department} / ${confirmName}`);
    assert.ok(!calls.some((c) => c.endsWith(".delete") || c.endsWith(".deleteMany")), "nothing deleted");
  }
});

test("delete vehicle: Admin only, and its records go before the vehicle", async () => {
  setCurrentUser(REAL_USER);
  const ops = recordingDb(OPS);
  setDbStub(ops.db);
  const denied = await actions.deleteVehicleAction({ error: null }, form({ vehicleId: "veh_1", confirmName: "Fund" }));
  assert.equal(denied.error, GENERIC_ACCESS_DENIED);

  const admin = recordingDb(ADMIN, {
    vehicle: { findUnique: async () => ({ nameEn: "Fund", slug: "fund" }), delete: async () => ({}) },
  });
  setDbStub(admin.db);
  await assert.rejects(
    () => actions.deleteVehicleAction({ error: null }, form({ vehicleId: "veh_1", confirmName: "Fund" })),
    isRedirectTo("/admin/manage/new-vehicle")
  );
  const deleted = admin.calls.indexOf("vehicle.delete");
  assert.ok(deleted > 0);
  assert.ok(admin.calls.indexOf("vehicleNavSnapshot.deleteMany") < deleted);
  assert.ok(admin.calls.indexOf("investorVehiclePosition.deleteMany") < deleted);
  assert.ok(admin.calls.indexOf("ownershipPosition.deleteMany") < deleted);
});

test("templates: an Investment Professional can create one", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        reportingTemplate: { create: async () => ({ id: "t_new" }) },
        metricDefinition: { createMany: async () => ({ count: 1 }) },
      },
    })
  );
  const result = await actions.createReportingTemplateAction(
    { error: null },
    form({ nameEn: "Quarterly", nameAr: "ربع سنوي", metricKey_0: "revenue_b2b", metricLabelEn_0: "Revenue", metricLabelAr_0: "الإيرادات", metricDataType_0: "Currency" })
  );
  assert.equal(result.error, null);
});

test("templates: editing keeps a locked metric's key and data type, and applies the rest", async () => {
  setCurrentUser(REAL_USER);
  const updates: { where: { id: string }; data: Record<string, unknown> }[] = [];
  let created: unknown[] = [];
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        metricDefinition: {
          findMany: async () => [
            { id: "m1", key: "revenue_b2b", dataType: "Currency", sortOrder: 1, labelEn: "Revenue", _count: { currentValues: 3, snapshotValues: 0 } },
            { id: "m2", key: "old_key", dataType: "Number", sortOrder: 2, labelEn: "Old", _count: { currentValues: 0, snapshotValues: 0 } },
          ],
          update: async (args: { where: { id: string }; data: Record<string, unknown> }) => {
            updates.push(args);
            return {};
          },
          createMany: async ({ data }: { data: unknown[] }) => {
            created = data;
            return { count: data.length };
          },
        },
        reportingTemplate: { update: async () => ({}) },
      },
    })
  );
  const result = await actions.updateReportingTemplateAction(
    { error: null },
    form({
      templateId: "t1",
      nameEn: "Quarterly",
      nameAr: "ربع سنوي",
      templateActive: "on",
      key_m1: "tampered_key",
      dataType_m1: "Text",
      labelEn_m1: "Total Revenue",
      labelAr_m1: "الإيرادات",
      sortOrder_m1: "1",
      isActive_m1: "on",
      key_m2: "new_key",
      dataType_m2: "Percent",
      labelEn_m2: "Renamed",
      labelAr_m2: "معدل",
      sortOrder_m2: "2",
      newKey_0: "cust_nps",
      newLabelEn_0: "NPS",
      newLabelAr_0: "صافي نقاط الترويج",
      newDataType_0: "Number",
    })
  );
  assert.equal(result.error, null);
  const m1 = updates.filter((u) => u.where.id === "m1").at(-1)!.data;
  assert.equal(m1.labelEn, "Total Revenue");
  assert.equal("key" in m1, false, "locked key untouched");
  assert.equal("dataType" in m1, false, "locked data type untouched");
  const m2 = updates.filter((u) => u.where.id === "m2").at(-1)!.data;
  assert.equal(m2.key, "new_key");
  assert.equal(m2.dataType, "Percent");
  assert.equal(m2.isActive, false, "unticked means hidden");
  assert.equal(created.length, 1);
});

test("templates: a duplicate metric key is refused and the submitted values come back", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAdminActionDbStub({
      falakRoles: OPS,
      models: {
        metricDefinition: {
          findMany: async () => [
            { id: "m1", key: "revenue_b2b", dataType: "Currency", sortOrder: 1, labelEn: "Revenue", _count: { currentValues: 1, snapshotValues: 0 } },
          ],
        },
      },
    })
  );
  const result = await actions.updateReportingTemplateAction(
    { error: null },
    form({
      templateId: "t1",
      nameEn: "Quarterly",
      nameAr: "ربع سنوي",
      labelEn_m1: "Revenue",
      labelAr_m1: "الإيرادات",
      sortOrder_m1: "1",
      newKey_0: "revenue_b2b",
      newLabelEn_0: "Dup",
      newLabelAr_0: "مكرر",
      newDataType_0: "Number",
    })
  );
  assert.match(result.error ?? "", /used twice/);
  assert.equal(result.values?.newLabelEn_0, "Dup");
});
