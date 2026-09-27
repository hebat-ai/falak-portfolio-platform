// Node ESM loader hook, registered via `node --import ./tests/support/register.mjs`.
// Built entirely on Node's own module-customization API (node:module
// register/resolve/load hooks) -- no test framework, no new dependency.
//
// Its job: let plain `node --test` resolve this project's `@/*`
// TypeScript path alias (which only Next.js's own bundler normally
// understands), so the REAL, unmodified source files under src/ can be
// imported and executed directly in tests, with exactly three specifiers
// substituted:
//
//   - "server-only"              -> a no-op stub. This package is not
//                                    actually installed in node_modules at
//                                    all -- Next.js's bundler provides it
//                                    internally; outside that bundler it
//                                    has zero runtime behavior anyway, so
//                                    a no-op module is faithful, not a
//                                    behavior change.
//   - "@/lib/db"                 -> a synthetic module whose `db` export
//                                    is a Proxy that live-reads
//                                    globalThis.__TEST_DB_STUB__ on every
//                                    property access -- never a real
//                                    PrismaClient, never a live
//                                    connection, never Neon.
//   - "@/lib/auth/current-user"  -> a synthetic module whose
//                                    `getCurrentUser` forwards live to
//                                    globalThis.__TEST_GET_CURRENT_USER_STUB__.
//
// Every other "@/..." specifier resolves to the real file on disk under
// src/ and is loaded completely unmodified -- including
// src/lib/auth/authorization.ts, src/lib/auth/authorization-errors.ts,
// src/lib/reporting/*.ts, and src/auth.ts's own non-mocked logic.
import { pathToFileURL } from "node:url";
import path from "node:path";
import { fileURLToPath } from "node:url";

const PROJECT_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../src");
const SRC_ROOT = PROJECT_ROOT.replace(/\\/g, "/");

export async function resolve(specifier, context, nextResolve) {
  if (specifier === "server-only") {
    return { url: "mock:server-only", shortCircuit: true };
  }
  if (specifier === "@/lib/db") {
    return { url: "mock:db", shortCircuit: true };
  }
  if (specifier === "@/lib/auth/current-user") {
    return { url: "mock:current-user", shortCircuit: true };
  }
  if (specifier.startsWith("@/")) {
    const rewritten = pathToFileURL(`${SRC_ROOT}/${specifier.slice(2)}.ts`).href;
    return nextResolve(rewritten, context);
  }
  return nextResolve(specifier, context);
}

export async function load(url, context, nextLoad) {
  if (url === "mock:server-only") {
    return { format: "module", shortCircuit: true, source: "export {};" };
  }
  if (url === "mock:db") {
    return {
      format: "module",
      shortCircuit: true,
      source: "export const db = new Proxy({}, { get: (_t, prop) => globalThis.__TEST_DB_STUB__[prop] });",
    };
  }
  if (url === "mock:current-user") {
    return {
      format: "module",
      shortCircuit: true,
      source: "export const getCurrentUser = (...args) => globalThis.__TEST_GET_CURRENT_USER_STUB__(...args);",
    };
  }
  return nextLoad(url, context);
}
