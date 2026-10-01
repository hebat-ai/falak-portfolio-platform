import { test } from "node:test";
import assert from "node:assert/strict";
import { setDbStub } from "./support/stubs.ts";

// Real modules via tests/support/mock-loader.mjs: authorizePassword and
// the real hashPassword it verifies against. Only @/lib/db is stubbed.
const { authorizePassword } = await import("../src/lib/auth/authorize-password.ts");
const { hashPassword } = await import("../src/lib/auth/password.ts");

interface UserFixture {
  id: string;
  email: string;
  passwordHash: string | null;
  deactivatedAt: Date | null;
}

function makeUserDbStub(users: UserFixture[]) {
  return {
    user: {
      findUnique: async ({ where }: { where: { email?: string } }) => {
        const user = users.find((u) => u.email === where.email);
        if (!user) return null;
        return { id: user.id, passwordHash: user.passwordHash, deactivatedAt: user.deactivatedAt };
      },
    },
  };
}

test("authorizePassword: correct email+password for an active user with a password returns the user id", async () => {
  const hash = await hashPassword("correct horse battery staple");
  setDbStub(makeUserDbStub([{ id: "user_1", email: "alice@example.com", passwordHash: hash, deactivatedAt: null }]));

  const result = await authorizePassword({ email: "alice@example.com", password: "correct horse battery staple" });
  assert.deepEqual(result, { id: "user_1" });
});

test("authorizePassword: email lookup is normalized (case/whitespace insensitive)", async () => {
  const hash = await hashPassword("correct horse battery staple");
  setDbStub(makeUserDbStub([{ id: "user_1", email: "alice@example.com", passwordHash: hash, deactivatedAt: null }]));

  const result = await authorizePassword({ email: "  Alice@Example.com  ", password: "correct horse battery staple" });
  assert.deepEqual(result, { id: "user_1" });
});

test("authorizePassword: a wrong password is denied", async () => {
  const hash = await hashPassword("correct horse battery staple");
  setDbStub(makeUserDbStub([{ id: "user_1", email: "alice@example.com", passwordHash: hash, deactivatedAt: null }]));

  assert.equal(await authorizePassword({ email: "alice@example.com", password: "wrong password" }), null);
});

test("authorizePassword: an unknown email is denied", async () => {
  setDbStub(makeUserDbStub([]));
  assert.equal(await authorizePassword({ email: "nobody@example.com", password: "anything" }), null);
});

test("authorizePassword: a deactivated user is denied even with the correct password", async () => {
  const hash = await hashPassword("correct horse battery staple");
  setDbStub(
    makeUserDbStub([{ id: "user_1", email: "alice@example.com", passwordHash: hash, deactivatedAt: new Date("2026-01-01") }])
  );

  assert.equal(await authorizePassword({ email: "alice@example.com", password: "correct horse battery staple" }), null);
});

test("authorizePassword: an account with no password set yet is denied, same as a wrong password", async () => {
  setDbStub(makeUserDbStub([{ id: "user_1", email: "alice@example.com", passwordHash: null, deactivatedAt: null }]));

  assert.equal(await authorizePassword({ email: "alice@example.com", password: "anything" }), null);
});

test("authorizePassword: missing or non-string fields return null without any lookup", async () => {
  setDbStub(makeUserDbStub([]));
  assert.equal(await authorizePassword(undefined), null);
  assert.equal(await authorizePassword({}), null);
  assert.equal(await authorizePassword({ email: 123 as unknown as string, password: "x" }), null);
  assert.equal(await authorizePassword({ email: "a@b.com", password: 123 as unknown as string }), null);
});

test("authorizePassword: oversized raw input is rejected before any lookup", async () => {
  setDbStub(makeUserDbStub([]));
  assert.equal(await authorizePassword({ email: "a@b.com", password: "x".repeat(201) }), null);
  assert.equal(await authorizePassword({ email: `${"a".repeat(321)}@b.com`, password: "x" }), null);
});
