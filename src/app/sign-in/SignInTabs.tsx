"use client";

import { useState } from "react";
import { SignInForm } from "./SignInForm";
import { PasswordSignInForm } from "./PasswordSignInForm";

type Tab = "link" | "password";

// Ephemeral tab state, not persisted -- same precedent as every other
// view-mode toggle in this app (e.g. CompanyListClient's table/cards).
export function SignInTabs() {
  const [tab, setTab] = useState<Tab>("link");

  return (
    <div className="space-y-4">
      <div className="flex gap-2" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === "link"}
          onClick={() => setTab("link")}
          className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
            tab === "link"
              ? "bg-nebula-aqua text-dark-green"
              : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
          }`}
        >
          Email link
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === "password"}
          onClick={() => setTab("password")}
          className={`chamfer-br-sm px-3 py-1.5 text-sm font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground ${
            tab === "password"
              ? "bg-nebula-aqua text-dark-green"
              : "text-foreground shadow-[inset_0_0_0_1px_var(--control-border)] hover:bg-surface-muted"
          }`}
        >
          Password
        </button>
      </div>
      {tab === "link" ? <SignInForm /> : <PasswordSignInForm />}
    </div>
  );
}
