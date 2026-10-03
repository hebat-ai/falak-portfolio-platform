import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeVehicleCapitalDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getVehicleCapitalSummary } = await import("../src/lib/vehicle/capital.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleCapitalDbStub({ falakRoles: [] }));
  await assert.rejects(() => getVehicleCapitalSummary("veh_1"), ForbiddenError);
});

test("no positions -> empty array, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleCapitalDbStub({ falakRoles: ADMIN_ROLE, positions: [] }));
  const totals = await getVehicleCapitalSummary("veh_1");
  assert.deepEqual(totals, []);
});

test("sums committed and called across multiple LP positions", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleCapitalDbStub({
      falakRoles: ADMIN_ROLE,
      positions: [
        { vehicleId: "veh_1", commitmentAmount: 1000, calledAmount: 400, currency: "SAR" },
        { vehicleId: "veh_1", commitmentAmount: 2000, calledAmount: 600, currency: "SAR" },
      ],
    })
  );
  const totals = await getVehicleCapitalSummary("veh_1");
  assert.equal(totals.length, 1);
  assert.equal(totals[0].committed, 3000);
  assert.equal(totals[0].called, 1000);
});

test("currencies are never blended -- one entry per currency", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleCapitalDbStub({
      falakRoles: ADMIN_ROLE,
      positions: [
        { vehicleId: "veh_1", commitmentAmount: 1000, calledAmount: 400, currency: "SAR" },
        { vehicleId: "veh_1", commitmentAmount: 500, calledAmount: 200, currency: "USD" },
      ],
    })
  );
  const totals = await getVehicleCapitalSummary("veh_1");
  assert.equal(totals.length, 2);
  const sar = totals.find((t) => t.currency === "SAR");
  const usd = totals.find((t) => t.currency === "USD");
  assert.equal(sar?.committed, 1000);
  assert.equal(usd?.committed, 500);
});

test("a null commitmentAmount contributes 0, never excludes the row's calledAmount", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleCapitalDbStub({
      falakRoles: ADMIN_ROLE,
      positions: [{ vehicleId: "veh_1", commitmentAmount: null, calledAmount: 500, currency: "SAR" }],
    })
  );
  const totals = await getVehicleCapitalSummary("veh_1");
  assert.equal(totals[0].committed, 0);
  assert.equal(totals[0].called, 500);
});

test("only this vehicle's own positions are included", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleCapitalDbStub({
      falakRoles: ADMIN_ROLE,
      positions: [
        { vehicleId: "veh_1", commitmentAmount: 1000, calledAmount: 400, currency: "SAR" },
        { vehicleId: "veh_2", commitmentAmount: 9999, calledAmount: 9999, currency: "SAR" },
      ],
    })
  );
  const totals = await getVehicleCapitalSummary("veh_1");
  assert.equal(totals[0].committed, 1000);
});
