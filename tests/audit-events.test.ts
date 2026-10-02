import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAuditEventsDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { getAuditEvents } = await import("../src/lib/admin/audit.ts");
const { ForbiddenError } = await import("../src/lib/auth/authorization-errors.ts");

const ADMIN_ROLE = [{ role: "FALAK_ADMIN" }];
const OPERATIONS_ROLE = [{ role: "FALAK_OPERATIONS" }];

test("denies a caller with no Falak role", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuditEventsDbStub({ falakRoles: [] }));
  await assert.rejects(() => getAuditEvents(), ForbiddenError);
});

test("denies a FALAK_OPERATIONS-only caller (ADMIN-only gate)", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeAuditEventsDbStub({ falakRoles: OPERATIONS_ROLE }));
  await assert.rejects(() => getAuditEvents(), ForbiddenError);
});

test("returns events newest first with actor email resolved", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAuditEventsDbStub({
      falakRoles: ADMIN_ROLE,
      events: [
        { id: "e1", actorEmail: "a@falak.sa", action: "company.created", targetType: "Company", targetId: "co_1", createdAt: new Date("2026-01-01") },
        { id: "e2", actorEmail: "b@falak.sa", action: "company.archived", targetType: "Company", targetId: "co_1", createdAt: new Date("2026-02-01") },
      ],
    })
  );

  const result = await getAuditEvents();
  assert.equal(result.events.length, 2);
  assert.equal(result.events[0].id, "e2", "newest first");
  assert.equal(result.events[0].actorEmail, "b@falak.sa");
});

test("a system-actor event (no user) shows null actorEmail, not a crash", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAuditEventsDbStub({
      falakRoles: ADMIN_ROLE,
      events: [{ id: "e1", actorEmail: null, action: "report.published", targetType: "ReportVersion", targetId: "rv_1", createdAt: new Date() }],
    })
  );

  const result = await getAuditEvents();
  assert.equal(result.events[0].actorEmail, null);
});

test("action filter narrows results", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAuditEventsDbStub({
      falakRoles: ADMIN_ROLE,
      events: [
        { id: "e1", actorEmail: "a@falak.sa", action: "company.created", targetType: "Company", targetId: "co_1", createdAt: new Date("2026-01-01") },
        { id: "e2", actorEmail: "a@falak.sa", action: "vehicle.created", targetType: "Vehicle", targetId: "ve_1", createdAt: new Date("2026-01-02") },
      ],
    })
  );

  const result = await getAuditEvents(1, "company.created");
  assert.equal(result.events.length, 1);
  assert.equal(result.events[0].action, "company.created");
});

test("hasMore is true when more than one page of results exists", async () => {
  setCurrentUser(REAL_USER);
  const events = Array.from({ length: 51 }, (_, i) => ({
    id: `e${i}`,
    actorEmail: "a@falak.sa",
    action: "company.created",
    targetType: "Company",
    targetId: `co_${i}`,
    createdAt: new Date(2026, 0, i + 1),
  }));
  setDbStub(makeAuditEventsDbStub({ falakRoles: ADMIN_ROLE, events }));

  const result = await getAuditEvents(1);
  assert.equal(result.events.length, 50);
  assert.equal(result.hasMore, true);
});

test("distinct actions list is deduplicated and sorted", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeAuditEventsDbStub({
      falakRoles: ADMIN_ROLE,
      events: [
        { id: "e1", actorEmail: "a@falak.sa", action: "vehicle.created", targetType: "Vehicle", targetId: "v1", createdAt: new Date("2026-01-01") },
        { id: "e2", actorEmail: "a@falak.sa", action: "company.created", targetType: "Company", targetId: "c1", createdAt: new Date("2026-01-02") },
        { id: "e3", actorEmail: "a@falak.sa", action: "company.created", targetType: "Company", targetId: "c2", createdAt: new Date("2026-01-03") },
      ],
    })
  );

  const result = await getAuditEvents();
  assert.deepEqual(result.actions, ["company.created", "vehicle.created"]);
});
