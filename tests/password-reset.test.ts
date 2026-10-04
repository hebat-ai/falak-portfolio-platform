import { test } from "node:test";
import assert from "node:assert/strict";
import { setDbStub, setSendPasswordResetEmailSpy, makePasswordResetDbStub, type PasswordResetTokenFixture } from "./support/stubs.ts";

// Imports the REAL production module via tests/support/mock-loader.mjs.
const { requestPasswordReset, consumePasswordResetToken } = await import("../src/lib/auth/password-reset.ts");
const { hashSignInToken } = await import("../src/lib/auth/token.ts");

process.env.APP_BASE_URL = "http://localhost:3000";

const ACTIVE_USER = { id: "user_1", email: "alice@example.com", deactivatedAt: null };
const DEACTIVATED_USER = { id: "user_2", email: "bob@example.com", deactivatedAt: new Date("2026-01-01") };

function futureDate(): Date {
  return new Date(Date.now() + 30 * 60 * 1000);
}
function pastDate(): Date {
  return new Date(Date.now() - 60 * 1000);
}

// ============================================================
// requestPasswordReset
// ============================================================

test("requestPasswordReset: an active user gets exactly one token row and one email", async () => {
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER] });
  setDbStub(db);
  const sent = setSendPasswordResetEmailSpy();

  await requestPasswordReset("alice@example.com");

  assert.equal(db.getTokens().length, 1);
  assert.equal(sent.length, 1);
  assert.equal(sent[0].to, "alice@example.com");
  assert.match(sent[0].resetUrl, /\/reset-password\/confirm\?token=/);
});

test("requestPasswordReset: an unknown email resolves without creating a token or sending an email", async () => {
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER] });
  setDbStub(db);
  const sent = setSendPasswordResetEmailSpy();

  await requestPasswordReset("nobody@example.com");

  assert.equal(db.getTokens().length, 0);
  assert.equal(sent.length, 0);
});

test("requestPasswordReset: a deactivated user's email resolves without creating a token or sending an email", async () => {
  const db = makePasswordResetDbStub({ users: [DEACTIVATED_USER] });
  setDbStub(db);
  const sent = setSendPasswordResetEmailSpy();

  await requestPasswordReset("bob@example.com");

  assert.equal(db.getTokens().length, 0);
  assert.equal(sent.length, 0);
});

// ============================================================
// consumePasswordResetToken
// ============================================================

test("consumePasswordResetToken: a valid, unexpired, unused token sets a new passwordHash and marks itself consumed", async () => {
  const tokenRow: PasswordResetTokenFixture = {
    id: "reset_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-reset-token"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(db);

  const result = await consumePasswordResetToken("raw-reset-token", "a-new-strong-password");
  assert.equal(result.success, true);
  assert.equal(result.error, null);

  const stored = db.getTokens().find((t) => t.id === "reset_1");
  assert.ok(stored?.consumedAt, "token should be marked consumed after a successful claim");
  assert.ok(db.getUpdatedPasswordHashes()["user_1"], "passwordHash should have been updated for user_1");
});

test("consumePasswordResetToken: an unknown token is rejected, no password changed", async () => {
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [] });
  setDbStub(db);

  const result = await consumePasswordResetToken("never-issued", "a-new-strong-password");
  assert.equal(result.success, false);
  assert.equal(Object.keys(db.getUpdatedPasswordHashes()).length, 0);
});

test("consumePasswordResetToken: an already-consumed token is rejected", async () => {
  const tokenRow: PasswordResetTokenFixture = {
    id: "reset_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-reset-token"),
    expiresAt: futureDate(),
    consumedAt: new Date(),
  };
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(db);

  const result = await consumePasswordResetToken("raw-reset-token", "a-new-strong-password");
  assert.equal(result.success, false);
});

test("consumePasswordResetToken: an expired token is rejected", async () => {
  const tokenRow: PasswordResetTokenFixture = {
    id: "reset_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-reset-token"),
    expiresAt: pastDate(),
    consumedAt: null,
  };
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(db);

  const result = await consumePasswordResetToken("raw-reset-token", "a-new-strong-password");
  assert.equal(result.success, false);
});

test("consumePasswordResetToken: a too-short new password is rejected before touching the token", async () => {
  const tokenRow: PasswordResetTokenFixture = {
    id: "reset_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-reset-token"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(db);

  const result = await consumePasswordResetToken("raw-reset-token", "short");
  assert.equal(result.success, false);

  const stored = db.getTokens().find((t) => t.id === "reset_1");
  assert.equal(stored?.consumedAt, null, "token must stay unconsumed when the password itself is rejected");
});

test("consumePasswordResetToken: two claims of the same token -- only the first succeeds", async () => {
  const tokenRow: PasswordResetTokenFixture = {
    id: "reset_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-reset-token"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  const db = makePasswordResetDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(db);

  const [first, second] = await Promise.all([
    consumePasswordResetToken("raw-reset-token", "a-new-strong-password"),
    consumePasswordResetToken("raw-reset-token", "a-different-password"),
  ]);
  const successes = [first, second].filter((r) => r.success);
  assert.equal(successes.length, 1);
});
