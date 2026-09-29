import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeMyCompaniesDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module -- src/lib/submit/queries.ts -- via
// tests/support/mock-loader.mjs.
const { getMyCompaniesData } = await import("../src/lib/submit/queries.ts");
const { UnauthenticatedError } = await import("../src/lib/auth/authorization-errors.ts");

function company(id: string, nameEn: string, extra: Record<string, unknown> = {}) {
  return { id, slug: id, nameEn, ...extra };
}

const Q1 = { periodLabel: "Q1 2026", periodStart: new Date("2026-01-01"), currentDeadline: new Date("2026-04-15") };
const Q2 = { periodLabel: "Q2 2026", periodStart: new Date("2026-04-01"), currentDeadline: new Date("2026-07-15") };

test("unauthenticated caller is denied", async () => {
  setCurrentUser(null);
  setDbStub(makeMyCompaniesDbStub({}));
  await assert.rejects(() => getMyCompaniesData(), UnauthenticatedError);
});

test("no memberships -> empty list, no throw", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeMyCompaniesDbStub({ memberships: [] }));
  assert.deepEqual(await getMyCompaniesData(), []);
});

test("only the caller's own memberships are returned", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeMyCompaniesDbStub({
      memberships: [
        { userId: "user_1", role: "MEMBER", company: company("co_1", "Alpha") },
        { userId: "someone_else", role: "ADMIN", company: company("co_2", "Beta") },
      ],
    })
  );
  const result = await getMyCompaniesData();
  assert.deepEqual(
    result.map((c) => c.id),
    ["co_1"]
  );
  assert.equal(result[0].role, "MEMBER");
});

test("revoked membership and archived company are excluded", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeMyCompaniesDbStub({
      memberships: [
        { userId: "user_1", role: "MEMBER", revoked: true, company: company("co_1", "Alpha") },
        { userId: "user_1", role: "MEMBER", company: company("co_2", "Beta", { archived: true }) },
        { userId: "user_1", role: "MEMBER", company: company("co_3", "Gamma") },
      ],
    })
  );
  assert.deepEqual(
    (await getMyCompaniesData()).map((c) => c.id),
    ["co_3"]
  );
});

test("current period is the latest cycle by periodStart", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeMyCompaniesDbStub({
      memberships: [
        {
          userId: "user_1",
          role: "MEMBER",
          company: company("co_1", "Alpha", {
            cycles: [
              { ...Q1, submissionStatus: "approved" },
              { ...Q2, submissionStatus: "changes_requested" },
            ],
          }),
        },
      ],
    })
  );
  const [result] = await getMyCompaniesData();
  assert.deepEqual(result.currentPeriod, {
    label: "Q2 2026",
    status: "changes_requested",
    currentDeadline: "2026-07-15",
  });
});

test("company with no cycles -> currentPeriod null", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(makeMyCompaniesDbStub({ memberships: [{ userId: "user_1", role: "ADMIN", company: company("co_1", "Alpha") }] }));
  const [result] = await getMyCompaniesData();
  assert.equal(result.currentPeriod, null);
});

test("cycle with no submission row reads as draft", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(
    makeMyCompaniesDbStub({
      memberships: [
        { userId: "user_1", role: "MEMBER", company: company("co_1", "Alpha", { cycles: [{ ...Q1, submissionStatus: null }] }) },
      ],
    })
  );
  const [result] = await getMyCompaniesData();
  assert.equal(result.currentPeriod?.status, "draft");
});
