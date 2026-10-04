import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeVehicleDbStub, REAL_USER } from "./support/stubs.ts";

const { requireFalakRoleWithDepartmentScope } = await import("../src/lib/auth/department-scope.ts");

function stubWith(role: string, department: string | null) {
  const stub = makeVehicleDbStub({ falakRoles: [{ role }] }) as Record<string, unknown>;
  stub.user = { findUnique: async () => ({ department }) };
  return stub;
}

test("Admin is unscoped (departments null)", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(stubWith("FALAK_ADMIN", null));
  const scope = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS");
  assert.equal(scope.departments, null);
  assert.equal(scope.user.id, REAL_USER.id);
});

test("Operations is scoped to their own department", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(stubWith("FALAK_OPERATIONS", "VentureBuilder"));
  const scope = await requireFalakRoleWithDepartmentScope("FALAK_OPERATIONS");
  assert.deepEqual(scope.departments, ["VentureBuilder"]);
});

test("Management with no department assigned gets an empty scope (sees nothing), never unscoped", async () => {
  setCurrentUser(REAL_USER);
  setDbStub(stubWith("FALAK_MANAGEMENT", null));
  const scope = await requireFalakRoleWithDepartmentScope("FALAK_MANAGEMENT");
  assert.deepEqual(scope.departments, []);
});
