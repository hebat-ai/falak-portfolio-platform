import { test } from "node:test";
import assert from "node:assert/strict";
import { setCurrentUser, setDbStub, makeAdminActionDbStub, REAL_USER } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { adminSetStaffDepartmentAction } = await import("../src/app/admin/actions.ts");

function form(fields: Record<string, string>): FormData {
  const fd = new FormData();
  for (const [k, v] of Object.entries(fields)) fd.set(k, v);
  return fd;
}

// The caller is an Admin; `targetIsManagement` is whether the staff member
// being edited currently holds Management.
function makeStub(targetIsManagement: boolean) {
  const updates: Record<string, unknown>[] = [];
  const stub = makeAdminActionDbStub({
    models: {
      userRoleAssignment: {
        findMany: async () => [{ role: "FALAK_ADMIN" }],
        findFirst: async () => (targetIsManagement ? { id: "ura_1" } : null),
      },
      user: {
        update: async ({ data }: { data: Record<string, unknown> }) => {
          updates.push(data);
          return data;
        },
      },
    },
  });
  return { stub, updates };
}

test("staff department: Management can be set to both departments", async () => {
  setCurrentUser(REAL_USER);
  const { stub, updates } = makeStub(true);
  setDbStub(stub);
  const result = await adminSetStaffDepartmentAction({ error: null }, form({ userId: "u_2", department: "all" }));
  assert.equal(result.success, true);
  assert.deepEqual(updates, [{ department: null, allDepartments: true }]);
});

test("staff department: both departments is refused for an Investment Professional, nothing changes", async () => {
  setCurrentUser(REAL_USER);
  const { stub, updates } = makeStub(false);
  setDbStub(stub);
  const result = await adminSetStaffDepartmentAction({ error: null }, form({ userId: "u_2", department: "all" }));
  assert.ok(result.fieldErrors?.department);
  assert.equal(updates.length, 0);
});

test("staff department: choosing one department clears both-departments", async () => {
  setCurrentUser(REAL_USER);
  const { stub, updates } = makeStub(true);
  setDbStub(stub);
  const result = await adminSetStaffDepartmentAction({ error: null }, form({ userId: "u_2", department: "VentureBuilder" }));
  assert.equal(result.success, true);
  assert.deepEqual(updates, [{ department: "VentureBuilder", allDepartments: false }]);
});
