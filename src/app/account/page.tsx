import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { resolveLandingPath } from "@/lib/auth/landing";
import { db } from "@/lib/db";
import { Button } from "@/components/ui/Button";
import { SetPasswordForm } from "./SetPasswordForm";
import { signOutAction } from "./actions";

// The fallback landing for a signed-in user with no granted access yet --
// "/" (src/app/page.tsx) routes everyone with real access straight to
// their dashboard via resolveLandingPath, so this page is only ever
// reached two ways: a direct link, or genuinely having no role/
// membership (an approved AccessRequest not yet acted on further, or an
// account that's simply never been granted anything). Re-runs
// resolveLandingPath itself rather than trusting how the visitor
// arrived, so it never shows "pending approval" to someone who actually
// has access.
export default async function AccountPage({
  searchParams,
}: {
  searchParams: Promise<{ setPassword?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const { setPassword } = await searchParams;

  const landingPath = await resolveLandingPath(user.id);
  const isPending = landingPath === "/account";

  // Only the existence of a password is ever read here -- the hash
  // itself never crosses into CurrentUser (see current-user.ts's own
  // comment on why passwordHash is deliberately excluded from that
  // shape) or into a client component prop.
  const userRow = await db.user.findUnique({ where: { id: user.id }, select: { passwordHash: true } });
  const hasPassword = Boolean(userRow?.passwordHash);

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center gap-6 px-4 py-12">
      <div>
        <h1 className="mb-2 text-lg font-semibold text-foreground">{isPending ? "Pending approval" : "Signed in"}</h1>
        <p className="mb-6 text-sm text-muted-foreground">
          {user.email}
          {isPending ? (
            <span className="mt-2 block">
              Your access request is still under review. Falak will email you once it&apos;s approved.
            </span>
          ) : null}
        </p>
        <form action={signOutAction}>
          <Button type="submit" variant="outline">
            Sign out
          </Button>
        </form>
      </div>

      {!isPending && setPassword === "1" && !hasPassword ? (
        <p role="alert" className="chamfer-br-sm bg-surface-muted p-3 text-sm text-foreground shadow-[var(--inner-line)]">
          Set a password to continue. You signed in with an emailed link this time, but every sign-in after this one
          requires a password.
        </p>
      ) : null}

      {!isPending ? <SetPasswordForm hasPassword={hasPassword} /> : null}
    </main>
  );
}
