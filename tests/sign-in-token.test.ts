import { test } from "node:test";
import assert from "node:assert/strict";
import { setDbStub, setSendEmailSpy, makeSignInDbStub, type SignInTokenFixture } from "./support/stubs.ts";

// Imports the REAL production modules -- src/lib/auth/request-sign-in.ts,
// verify-sign-in.ts, and authorize-sign-in-token.ts -- via
// tests/support/mock-loader.mjs.
const { requestSignInLink } = await import("../src/lib/auth/request-sign-in.ts");
const { consumeSignInToken, InvalidSignInTokenError } = await import("../src/lib/auth/verify-sign-in.ts");
const { authorizeSignInToken } = await import("../src/lib/auth/authorize-sign-in-token.ts");
const { hashSignInToken } = await import("../src/lib/auth/token.ts");

// request-sign-in.ts reads this to build the verify link -- a real value
// is required before any successful-send test can run.
process.env.APP_BASE_URL = "http://localhost:3000";

const ACTIVE_USER = { id: "user_1", email: "alice@example.com", deactivatedAt: null };
const DEACTIVATED_USER = { id: "user_2", email: "bob@example.com", deactivatedAt: new Date("2026-01-01") };

function futureDate(): Date {
  return new Date(Date.now() + 15 * 60 * 1000);
}
function pastDate(): Date {
  return new Date(Date.now() - 60 * 1000);
}

// ============================================================
// consumeSignInToken
// ============================================================

test("consumeSignInToken: a valid, unexpired, unused token succeeds and marks itself consumed", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  const stub = makeSignInDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] });
  setDbStub(stub);

  const result = await consumeSignInToken("raw-token-1");
  assert.equal(result.userId, "user_1");

  const stored = stub.getTokens().find((t) => t.id === "token_1");
  assert.ok(stored?.consumedAt, "token should be marked consumed after a successful claim");
});

test("consumeSignInToken: an unknown token is rejected", async () => {
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] }));
  await assert.rejects(() => consumeSignInToken("never-issued"), InvalidSignInTokenError);
});

test("consumeSignInToken: an already-consumed token is rejected", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: futureDate(),
    consumedAt: new Date(),
  };
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] }));
  await assert.rejects(() => consumeSignInToken("raw-token-1"), InvalidSignInTokenError);
});

test("consumeSignInToken: an expired token is rejected", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: pastDate(),
    consumedAt: null,
  };
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] }));
  await assert.rejects(() => consumeSignInToken("raw-token-1"), InvalidSignInTokenError);
});

test("consumeSignInToken: two claims of the same token -- only the first succeeds", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] }));

  const first = await consumeSignInToken("raw-token-1");
  assert.equal(first.userId, "user_1");
  await assert.rejects(() => consumeSignInToken("raw-token-1"), InvalidSignInTokenError);
});

// ============================================================
// authorizeSignInToken
// ============================================================

test("authorizeSignInToken: a valid token for an active user returns the user id", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_1",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [tokenRow] }));

  const result = await authorizeSignInToken({ token: "raw-token-1" });
  assert.deepEqual(result, { id: "user_1" });
});

test("authorizeSignInToken: a valid token for a deactivated user is denied", async () => {
  const tokenRow: SignInTokenFixture = {
    id: "token_1",
    userId: "user_2",
    tokenHash: hashSignInToken("raw-token-1"),
    expiresAt: futureDate(),
    consumedAt: null,
  };
  setDbStub(makeSignInDbStub({ users: [DEACTIVATED_USER], tokens: [tokenRow] }));

  const result = await authorizeSignInToken({ token: "raw-token-1" });
  assert.equal(result, null);
});

test("authorizeSignInToken: a missing token field returns null", async () => {
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] }));
  assert.equal(await authorizeSignInToken(undefined), null);
  assert.equal(await authorizeSignInToken({}), null);
});

test("authorizeSignInToken: a non-string token returns null", async () => {
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] }));
  assert.equal(await authorizeSignInToken({ token: 12345 as unknown as string }), null);
});

test("authorizeSignInToken: a token over the raw length limit returns null", async () => {
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] }));
  const oversized = "a".repeat(513);
  assert.equal(await authorizeSignInToken({ token: oversized }), null);
});

test("authorizeSignInToken: an unknown token returns null", async () => {
  setDbStub(makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] }));
  assert.equal(await authorizeSignInToken({ token: "never-issued" }), null);
});

// ============================================================
// requestSignInLink -- enumeration safety
// ============================================================

test("requestSignInLink: an existing active user gets exactly one token row and one email", async () => {
  const stub = makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] });
  setDbStub(stub);
  const sentEmails = setSendEmailSpy();

  await requestSignInLink("alice@example.com");

  assert.equal(stub.getTokens().length, 1);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, "alice@example.com");
  assert.match(sentEmails[0].verifyUrl, /^http:\/\/localhost:3000\/api\/sign-in\/verify\?token=/);
});

test("requestSignInLink: email lookup is normalized (case/whitespace insensitive)", async () => {
  const stub = makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] });
  setDbStub(stub);
  const sentEmails = setSendEmailSpy();

  await requestSignInLink("  Alice@Example.com  ");

  assert.equal(stub.getTokens().length, 1);
  assert.equal(sentEmails.length, 1);
  assert.equal(sentEmails[0].to, "alice@example.com");
});

test("requestSignInLink: an unknown email resolves without creating a token or sending an email", async () => {
  const stub = makeSignInDbStub({ users: [ACTIVE_USER], tokens: [] });
  setDbStub(stub);
  const sentEmails = setSendEmailSpy();

  await requestSignInLink("nobody@example.com");

  assert.equal(stub.getTokens().length, 0);
  assert.equal(sentEmails.length, 0);
});

test("requestSignInLink: a deactivated user's email resolves without creating a token or sending an email", async () => {
  const stub = makeSignInDbStub({ users: [DEACTIVATED_USER], tokens: [] });
  setDbStub(stub);
  const sentEmails = setSendEmailSpy();

  await requestSignInLink("bob@example.com");

  assert.equal(stub.getTokens().length, 0);
  assert.equal(sentEmails.length, 0);
});
