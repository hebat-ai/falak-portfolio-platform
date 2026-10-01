import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { resolveLandingPath } from "@/lib/auth/landing";
import { Button } from "@/components/ui/Button";
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
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  const landingPath = await resolveLandingPath(user.id);
  const isPending = landingPath === "/account";

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
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
    </main>
  );
}
