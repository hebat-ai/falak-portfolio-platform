import { test } from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import { setDbStub } from "./support/stubs.ts";

// Imports the REAL authorizeCredentials from its own file (kept free of
// any next-auth import specifically so it's testable under plain Node --
// see that file's own doc comment). src/auth.ts's Credentials provider
// references this exact function, so this test exercises the real
// authentication decision, not a copy.
const { authorizeCredentials } = await import("../src/lib/auth/authorize-credentials.ts");

const REAL_PASSWORD = "correct horse battery staple";
const REAL_HASH = bcrypt.hashSync(REAL_PASSWORD, 4); // low cost factor: test speed only, never used for real users

function stubUserLookup(user: { id: string; passwordHash: string | null; deactivatedAt: Date | null } | null) {
  setDbStub({
    user: {
      findUnique: async ({ where }: { where: { email: string } }) => {
        if (!user) return null;
        return where.email === "a@b.com" ? user : null;
      },
    },
  });
}

test("correct email and password returns the user id", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: null });
  const result = await authorizeCredentials({ email: "A@B.com", password: REAL_PASSWORD });
  assert.deepEqual(result, { id: "user_1" });
});

test("email lookup is normalized (case/whitespace insensitive)", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: null });
  const result = await authorizeCredentials({ email: "  A@B.com  ", password: REAL_PASSWORD });
  assert.deepEqual(result, { id: "user_1" });
});

test("wrong password returns null", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: null });
  const result = await authorizeCredentials({ email: "a@b.com", password: "wrong password entirely" });
  assert.equal(result, null);
});

test("unknown email returns null (same shape as wrong password)", async () => {
  stubUserLookup(null);
  const result = await authorizeCredentials({ email: "nobody@b.com", password: REAL_PASSWORD });
  assert.equal(result, null);
});

test("deactivated user cannot authenticate even with the correct password", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: new Date() });
  const result = await authorizeCredentials({ email: "a@b.com", password: REAL_PASSWORD });
  assert.equal(result, null);
});

test("a row with a missing/empty passwordHash can never authenticate", async () => {
  stubUserLookup({ id: "user_1", passwordHash: "", deactivatedAt: null });
  const result = await authorizeCredentials({ email: "a@b.com", password: "not-a-real-password" });
  assert.equal(result, null);
});

test("missing email or password fields return null", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: null });
  assert.equal(await authorizeCredentials({ email: "a@b.com" }), null);
  assert.equal(await authorizeCredentials({ password: REAL_PASSWORD }), null);
  assert.equal(await authorizeCredentials(undefined), null);
});

test("an email over the raw length limit is rejected without matching any user", async () => {
  stubUserLookup({ id: "user_1", passwordHash: REAL_HASH, deactivatedAt: null });
  const oversizedEmail = "a".repeat(400) + "@b.com";
  const result = await authorizeCredentials({ email: oversizedEmail, password: REAL_PASSWORD });
  assert.equal(result, null);
});

test("a password over the raw length limit is rejected, even if its first 72 bytes match a real (72-byte) password", async () => {
  const seventyTwoByteMatchingPrefix = "x".repeat(72);
  const hashOfSeventyTwoBytePassword = bcrypt.hashSync(seventyTwoByteMatchingPrefix, 4);
  stubUserLookup({ id: "user_1", passwordHash: hashOfSeventyTwoBytePassword, deactivatedAt: null });
  const overlongCandidate = seventyTwoByteMatchingPrefix + "extra characters beyond the bcrypt limit that must not let this match";
  const result = await authorizeCredentials({ email: "a@b.com", password: overlongCandidate });
  assert.equal(result, null, "must not authenticate merely by sharing a 72-byte bcrypt-visible prefix");
});
