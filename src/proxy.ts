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
// Scope is deliberately narrow: today this only steers an already-signed-
// in visitor away from the sign-in page. There is no protected dashboard
// route to gate yet (Step 4 does not connect the existing mock-data pages
// to Prisma), so the matcher below covers exactly the one page this
// step ships.
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
