import { RequestResetForm } from "./RequestResetForm";

export default function ResetPasswordPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-2 text-lg font-semibold text-foreground">Reset your password</h1>
      <p className="mb-6 text-sm text-muted-foreground">Enter your account email and we&apos;ll send you a link to set a new password.</p>
      <RequestResetForm />
    </main>
  );
}
