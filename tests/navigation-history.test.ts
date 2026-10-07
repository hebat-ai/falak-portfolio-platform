import { test, beforeEach } from "node:test";
import assert from "node:assert/strict";

// Minimal sessionStorage for Node.
const store = new Map<string, string>();
(globalThis as Record<string, unknown>).sessionStorage = {
  getItem: (k: string) => store.get(k) ?? null,
  setItem: (k: string, v: string) => void store.set(k, v),
};

const { recordVisit, canGoBack } = await import("../src/lib/navigation-history.ts");

beforeEach(() => store.clear());

test("no Back on the first page; Back once you've moved to another page", () => {
  recordVisit("/admin");
  assert.equal(canGoBack(), false);
  recordVisit("/admin/companies");
  assert.equal(canGoBack(), true);
});

test("going back pops the page, so Back disappears again at the first page", () => {
  recordVisit("/admin");
  recordVisit("/admin/companies");
  recordVisit("/company/acme");
  recordVisit("/admin/companies"); // back
  assert.equal(canGoBack(), true);
  recordVisit("/admin"); // back
  assert.equal(canGoBack(), false);
});

test("re-rendering the same page doesn't add history", () => {
  recordVisit("/admin");
  recordVisit("/admin");
  assert.equal(canGoBack(), false);
});

test("signing in starts fresh: Back never leads to the sign-in page", () => {
  recordVisit("/admin");
  recordVisit("/admin/companies");
  recordVisit("/sign-in");
  recordVisit("/admin");
  assert.equal(canGoBack(), false);
});
