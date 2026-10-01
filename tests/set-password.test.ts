import { test } from "node:test";
import assert from "node:assert/strict";
import { setDbStub } from "./support/stubs.ts";

// Real modules via tests/support/mock-loader.mjs: setPassword and the
// real hashPassword/verifyPassword it calls. Only @/lib/db is stubbed.
const { setPassword } = await import("../src/lib/auth/set-password.ts");
const { hashPassword, verifyPassword } = await import("../src/lib/auth/password.ts");

function makeStub(passwordHash: string | null) {
  const updates: { where: { id: string }; data: { passwordHash: string } }[] = [];
  return {
    db: {
      user: {
        findUnique: async ({ where }: { where: { id: string } }) =>
          where.id === "user_1" ? { passwordHash } : null,
        update: async (args: { where: { id: string }; data: { passwordHash: string } }) => {
          updates.push(args);
          return args;
        },
      },
    },
    updates,
  };
}

test("setPassword: first-time set (no existing hash) needs no current password", async () => {
  const { db, updates } = makeStub(null);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: undefined,
    newPassword: "a long enough password",
    confirmPassword: "a long enough password",
  });

  assert.deepEqual(result, { error: null, success: true });
  assert.equal(updates.length, 1);
  assert.equal(updates[0].where.id, "user_1");
  assert.equal(await verifyPassword("a long enough password", updates[0].data.passwordHash), true);
});

test("setPassword: changing an existing password requires and verifies the current one", async () => {
  const currentHash = await hashPassword("old password 123");
  const { db, updates } = makeStub(currentHash);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: "old password 123",
    newPassword: "new password 456",
    confirmPassword: "new password 456",
  });

  assert.deepEqual(result, { error: null, success: true });
  assert.equal(updates.length, 1);
});

test("setPassword: wrong current password is rejected, no update written", async () => {
  const currentHash = await hashPassword("old password 123");
  const { db, updates } = makeStub(currentHash);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: "totally wrong",
    newPassword: "new password 456",
    confirmPassword: "new password 456",
  });

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /incorrect/i);
  assert.equal(updates.length, 0);
});

test("setPassword: missing current password when one is already set is rejected", async () => {
  const currentHash = await hashPassword("old password 123");
  const { db, updates } = makeStub(currentHash);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: undefined,
    newPassword: "new password 456",
    confirmPassword: "new password 456",
  });

  assert.equal(result.success, false);
  assert.equal(updates.length, 0);
});

test("setPassword: too-short new password is rejected", async () => {
  const { db, updates } = makeStub(null);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: undefined,
    newPassword: "short1",
    confirmPassword: "short1",
  });

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /at least/i);
  assert.equal(updates.length, 0);
});

test("setPassword: mismatched new/confirm passwords are rejected", async () => {
  const { db, updates } = makeStub(null);
  setDbStub(db);

  const result = await setPassword("user_1", {
    currentPassword: undefined,
    newPassword: "a long enough password",
    confirmPassword: "a different long password",
  });

  assert.equal(result.success, false);
  assert.match(result.error ?? "", /match/i);
  assert.equal(updates.length, 0);
});
