import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth/current-user";
import { Button } from "@/components/ui/Button";
import { signOutAction } from "./actions";

// Deliberately minimal: proves getCurrentUser() and sign-out both work,
// nothing more. No profile editing, no role/membership display (that
// belongs to the later authorization step, which reads roles/memberships
// fresh from the database itself rather than trusting anything cached
// here), no dashboards.
export default async function AccountPage() {
  const user = await getCurrentUser();
  if (!user) {
    redirect("/sign-in");
  }

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-lg font-semibold text-foreground">Signed in</h1>
      <p className="mb-6 text-sm text-muted-foreground">{user.email}</p>
      <form action={signOutAction}>
        <Button type="submit" variant="outline">
          Sign out
        </Button>
      </form>
    </main>
  );
}
