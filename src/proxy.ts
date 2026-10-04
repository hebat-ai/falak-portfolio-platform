import { NextResponse } from "next/server";
import { auth } from "@/auth";

// Navigation convenience ONLY -- not the security boundary. `req.auth`
// here reflects a cryptographically valid JWT (via Auth.js's own `auth()`
// wrapper), nothing more: it does not re-check `deactivatedAt`, and it
// never sees role/membership data (none of that is stored in the JWT to
// begin with -- see src/auth.ts). Every protected server page, route
// handler, and Server Action re-verifies the session AND the live
// database user via getCurrentUser() in src/lib/auth/current-user.ts;
// nothing here substitutes for that.
//
// A DB-querying forced-password-setup check briefly lived here (to
// redirect a never-set-a-password user to /account on every request) --
// reverted: it broke every admin Server Action submission in production
// (forms appeared to "succeed" with fields cleared, but nothing was ever
// written -- the mutation never actually ran). Root cause not fully
// isolated, but Proxy awaiting a database call ahead of a Server Action
// POST is the prime suspect, and this file's own original rule (never
// touch the database here) was exactly the guardrail that would have
// prevented it. The forced-password-setup requirement still needs
// implementing, but the next attempt must NOT live in Proxy -- a
// per-page check (the same requireCurrentUser()-adjacent pattern every
// other page already uses) is the safe path.
//
// Scope is deliberately narrow: today this only steers an already-signed-
// in visitor away from the sign-in page.
export const proxy = auth((req) => {
  const isSignedIn = Boolean(req.auth);
  // Redirects to "/" rather than straight to "/account": "/" is the real
  // role-based router (src/app/page.tsx), which this edge check cannot
  // replicate itself (req.auth only reflects a valid JWT, never role/
  // membership data -- see this file's own header comment). "/" is
  // deliberately NOT added to this matcher: it already does its own
  // signed-in redirect server-side, with the actual role resolution this
  // proxy can't perform, so gating it here too would just race a dumber
  // decision against the real one.
  if (isSignedIn && req.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }
});

export const config = {
  matcher: ["/sign-in"],
};
