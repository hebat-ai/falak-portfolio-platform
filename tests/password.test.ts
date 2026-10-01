import { test } from "node:test";
import assert from "node:assert/strict";

// Pure functions, no @/lib/db or any other mocked boundary involved.
const { hashPassword, verifyPassword } = await import("../src/lib/auth/password.ts");

test("hashPassword/verifyPassword: round-trips correctly", async () => {
  const stored = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("correct horse battery staple", stored), true);
});

test("verifyPassword: a wrong password is rejected", async () => {
  const stored = await hashPassword("correct horse battery staple");
  assert.equal(await verifyPassword("wrong password", stored), false);
});

test("hashPassword: two hashes of the same password differ (random salt per call)", async () => {
  const a = await hashPassword("same password");
  const b = await hashPassword("same password");
  assert.notEqual(a, b);
  assert.equal(await verifyPassword("same password", a), true);
  assert.equal(await verifyPassword("same password", b), true);
});

test("verifyPassword: a malformed stored value is rejected, never throws", async () => {
  assert.equal(await verifyPassword("anything", "not-a-valid-stored-hash"), false);
  assert.equal(await verifyPassword("anything", ""), false);
  assert.equal(await verifyPassword("anything", "onlysalt:"), false);
});
