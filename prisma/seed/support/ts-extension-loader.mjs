// Generic Node ESM loader hook for running standalone scripts (like the
// seed script) against Prisma 7's generated client directly under plain
// `node`, outside Next.js's own bundler.
//
// Prisma 7's "prisma-client" generator emits bundler-oriented TypeScript
// source whose OWN internal relative imports have no file extension
// (./enums, ./internal/class, ...) -- fine for Next.js/webpack's
// bundler-mode resolution, not resolvable by plain Node ESM, which requires
// explicit extensions. This hook retries any relative specifier that fails
// to resolve by appending ".ts" -- the same technique (and the same
// node:module customization API) already used by
// tests/support/mock-loader.mjs for the @/* alias, generalized here to a
// plain extension fallback with no @/ rewriting or stubbing at all.
export async function resolve(specifier, context, nextResolve) {
  try {
    return await nextResolve(specifier, context);
  } catch (err) {
    if (err?.code === "ERR_MODULE_NOT_FOUND" && (specifier.startsWith("./") || specifier.startsWith("../"))) {
      return nextResolve(`${specifier}.ts`, context);
    }
    throw err;
  }
}
