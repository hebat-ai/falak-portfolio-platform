"use client";

interface RevokeButtonProps {
  action: (formData: FormData) => Promise<void>;
  fieldName: "membershipId" | "inviteId";
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
      <button
        type="submit"
        className="rounded border border-control-border px-2 py-1 text-xs font-medium text-foreground hover:bg-surface-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-link-foreground"
      >
        {label}
      </button>
    </form>
  );
}
