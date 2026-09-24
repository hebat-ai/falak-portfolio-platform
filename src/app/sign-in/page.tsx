import { SignInForm } from "./SignInForm";

export default function SignInPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Sign in</h1>
      <SignInForm />
    </main>
  );
}
