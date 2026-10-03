import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeVehicleNavDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getVehicleNavSummary } = await import("../src/lib/vehicle/nav.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleNavDbStub({ falakRoles: [] }));
  await assert.rejects(() => getVehicleNavSummary("veh_1"), ForbiddenError);
});

test("no NAV marks recorded -> latest null, empty history, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeVehicleNavDbStub({ falakRoles: ADMIN_ROLE, snapshots: [] }));
  const summary = await getVehicleNavSummary("veh_1");
  assert.deepEqual(summary, { latest: null, history: [] });
});

test("latest is the most recent mark by asOfDate, history is oldest-first", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleNavDbStub({
      falakRoles: ADMIN_ROLE,
      snapshots: [
        { vehicleId: "veh_1", asOfDate: new Date("2026-01-01"), navAmount: 1000, currency: "SAR" },
        { vehicleId: "veh_1", asOfDate: new Date("2026-06-01"), navAmount: 1500, currency: "SAR" },
      ],
    })
  );
  const summary = await getVehicleNavSummary("veh_1");
  assert.equal(summary.latest?.amount, 1500);
  assert.equal(summary.history.length, 2);
  assert.equal(summary.history[0].amount, 1000);
  assert.equal(summary.history[1].amount, 1500);
});

test("only this vehicle's own marks are included", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeVehicleNavDbStub({
      falakRoles: ADMIN_ROLE,
      snapshots: [
        { vehicleId: "veh_1", asOfDate: new Date("2026-01-01"), navAmount: 1000, currency: "SAR" },
        { vehicleId: "veh_2", asOfDate: new Date("2026-01-01"), navAmount: 9999, currency: "SAR" },
      ],
    })
  );
  const summary = await getVehicleNavSummary("veh_1");
  assert.equal(summary.history.length, 1);
  assert.equal(summary.latest?.amount, 1000);
});
