import Link from "next/link";
import { SignUpForm } from "./SignUpForm";

export default function SignUpPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Request access</h1>
      <SignUpForm />
      <p className="mt-6 text-xs text-muted-foreground">
        Already have access?{" "}
        <Link href="/sign-in" className="text-link-foreground hover:underline">
          Sign in
        </Link>
      </p>
    </main>
  );
}
