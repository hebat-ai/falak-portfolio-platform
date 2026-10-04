import { ConfirmResetForm } from "./ConfirmResetForm";

export default async function ConfirmResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string | string[] }>;
}) {
  const { token: rawToken } = await searchParams;
  const token = Array.isArray(rawToken) ? rawToken[0] : rawToken;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Set a new password</h1>
      {token ? (
        <ConfirmResetForm token={token} />
      ) : (
        <p role="alert" className="text-sm text-foreground">
          This reset link is missing or invalid. Request a new one from the sign-in page.
        </p>
      )}
    </main>
  );
}
