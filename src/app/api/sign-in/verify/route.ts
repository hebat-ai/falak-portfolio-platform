import { NextResponse, type NextRequest } from "next/server";
import { signIn } from "@/auth";
import { MAX_RAW_INVITE_TOKEN_LENGTH } from "@/lib/auth/utils";

// Visiting this link IS the one-time action (the standard "magic link"
// shape) -- the unguessable token in the query string is what authorizes
// it, the same bearer-token reasoning the invite-acceptance flow already
// relies on. redirect: false still lets signIn() throw on failure
// (verified against next-auth's own source, same as sign-in/actions.ts),
// so every failure reason -- malformed, expired, already-used, or a
// deactivated account -- collapses to the same redirect, never revealing
// which one occurred.
export async function GET(request: NextRequest) {
  const token = request.nextUrl.searchParams.get("token");

  if (!token || token.length === 0 || token.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return NextResponse.redirect(new URL("/sign-in?error=1", request.url));
  }

  try {
    await signIn("credentials", { token, redirect: false });
  } catch {
    return NextResponse.redirect(new URL("/sign-in?error=1", request.url));
  }

  return NextResponse.redirect(new URL("/account", request.url));
}
