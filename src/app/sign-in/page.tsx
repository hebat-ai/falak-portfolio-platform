import { SignInTabs } from "./SignInTabs";

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; accepted?: string }>;
}) {
  const { error, accepted } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Sign in</h1>
      {error ? (
        <p role="alert" className="mb-4 text-xs font-medium text-foreground">
          That link is invalid or has expired. Enter your email below to get a new one.
        </p>
      ) : null}
      {accepted ? (
        <p role="status" className="mb-4 text-xs text-muted-foreground">
          Account created. Enter your email below to sign in.
        </p>
      ) : null}
      <SignInTabs />
    </main>
  );
}
