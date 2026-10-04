import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { db } from "@/lib/db";

// Proxy (Next.js 16's renamed middleware) always runs on Node.js --
// unlike the old Edge-only middleware, it can safely query Postgres
// (via @prisma/adapter-pg) directly, which is what the forced-
// password-setup check below does. A deliberate exception to this
// file's own original "navigation convenience only, never touches the
// database" rule (see the comment that used to sit here) -- that
// original rule still holds for the sign-in redirect below, which
// stays JWT-only; only the new password-setup check performs a real
// query, and even it still fails open (see its own comment) rather
// than becoming a second, independent security boundary.

// Every route a user must be able to reach WITHOUT having set a
// password yet -- sign-in/sign-up/invite-acceptance flows, the account
// page itself (where the forced redirect below sends them), the
// password-reset flow, and the API routes the above all depend on
// (NextAuth's own handlers, the sign-in-link verify endpoint). Anything
// NOT in this list is treated as real app content, gated by the
// forced-password-setup check.
const PASSWORD_SETUP_EXEMPT_PREFIXES = [
  "/sign-in",
  "/sign-up",
  "/account",
  "/reset-password",
  "/accept-invite",
  "/accept-investor-invite",
  "/api/",
];

export const proxy = auth(async (req) => {
  const isSignedIn = Boolean(req.auth);

  // Redirects to "/" rather than straight to "/account": "/" is the real
  // role-based router (src/app/page.tsx), which this check cannot
  // replicate itself (req.auth only reflects a valid JWT, never role/
  // membership data -- see src/auth.ts). "/" is deliberately NOT added
  // to the matcher below: it already does its own signed-in redirect
  // server-side, with the actual role resolution this proxy can't
  // perform, so gating it here too would just race a dumber decision
  // against the real one.
  if (isSignedIn && req.nextUrl.pathname === "/sign-in") {
    return NextResponse.redirect(new URL("/", req.nextUrl));
  }

  // Forces every non-FALAK_ADMIN user who has never set a password to
  // set one (redirected to /account) before reaching any real page --
  // "sign in via the link only the first time, then use a password
  // every other time." A user who already has a passwordHash is never
  // redirected here again, regardless of which method (link or
  // password) they sign in with going forward -- the magic link stays
  // available as a fallback by design; this check only ever fires for
  // the ONE-TIME "no password yet" state, not on every login.
  //
  // Fails open, deliberately: no session, or any lookup that comes back
  // empty/errors, lets the request through to render normally -- the
  // page's own requireCurrentUser()/getCurrentUser() check is the real
  // authentication gate (unchanged); this only ever ADDS a redirect for
  // an already-authenticated session with a real, determinable "no
  // password yet, not exempt" state, never a new way to deny access.
  const userId = req.auth?.user?.id;
  if (userId && !PASSWORD_SETUP_EXEMPT_PREFIXES.some((prefix) => req.nextUrl.pathname.startsWith(prefix))) {
    try {
      const user = await db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
      if (user && !user.passwordHash) {
        const adminRole = await db.userRoleAssignment.findFirst({
          where: { userId, role: "FALAK_ADMIN", revokedAt: null },
          select: { id: true },
        });
        if (!adminRole) {
          const url = req.nextUrl.clone();
          url.pathname = "/account";
          url.search = "?setPassword=1";
          return NextResponse.redirect(url);
        }
      }
    } catch {
      // Fails open -- see this block's own comment.
    }
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
