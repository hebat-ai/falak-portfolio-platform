import { test } from "node:test";
import assert from "node:assert/strict";
import { setDbStub } from "./support/stubs.ts";

const { submitAccessRequestAction } = await import("../src/app/sign-up/actions.ts");

// Any database access means the bot check let the request through.
const touched: string[] = [];
setDbStub(
  new Proxy({}, {
    get: (_t, model) => {
      if (model === "user") return undefined;
      touched.push(String(model));
      throw new Error("bot submission reached the database");
    },
  })
);

function form(fields: Record<string, string>) {
  const fd = new FormData();
  for (const [k, v] of Object.entries({ email: "bot@example.com", requestedRole: "INVESTOR", ...fields })) fd.set(k, v);
  return fd;
}

const initial = { error: null, sent: false };
const longAgo = String(Date.now() - 60_000);

for (const [name, fields] of [
  ["honeypot filled", { website: "http://spam.example", formStartedAt: longAgo }],
  ["no start time (form posted without the page's script)", {}],
  ["submitted under 3 seconds after loading", { formStartedAt: String(Date.now()) }],
] as const) {
  test(`bot check: ${name} -> reports success, saves nothing`, async () => {
    touched.length = 0;
    const result = await submitAccessRequestAction(initial, form(fields));
    assert.deepEqual(result, { error: null, sent: true });
    assert.deepEqual(touched, []);
  });
}

test("a staff role can no longer be requested publicly", async () => {
  const result = await submitAccessRequestAction(initial, form({ formStartedAt: longAgo, requestedRole: "INVESTMENT_PROFESSIONAL" }));
  assert.equal(result.sent, false);
  assert.deepEqual(touched, []);
});
