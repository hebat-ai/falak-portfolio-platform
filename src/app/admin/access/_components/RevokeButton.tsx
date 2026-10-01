"use client";

import { Button } from "@/components/ui/Button";

interface RevokeButtonProps {
  action: (formData: FormData) => Promise<void>;
  fieldName: "membershipId" | "inviteId" | "requestId";
  id: string;
  label: string;
  confirmMessage: string;
}

// A one-row form that asks before submitting -- revoking cuts someone's
// access on their next page load, so it shouldn't happen on a stray click.
export function RevokeButton({ action, fieldName, id, label, confirmMessage }: RevokeButtonProps) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmMessage)) e.preventDefault();
      }}
    >
      <input type="hidden" name={fieldName} value={id} />
      <Button type="submit" variant="outline" size="xs">
        {label}
      </Button>
    </form>
  );
}
