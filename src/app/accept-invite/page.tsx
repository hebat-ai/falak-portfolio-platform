import { db } from "@/lib/db";
import { getValidInvite } from "@/lib/auth/invite-lookup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MAX_RAW_INVITE_TOKEN_LENGTH } from "@/lib/auth/utils";
import { AcceptInviteForm } from "./AcceptInviteForm";
import { ExistingMemberConfirmForm } from "./ExistingMemberConfirmForm";

function InvalidInviteMessage() {
  return <p className="text-sm text-muted-foreground">This invitation link is invalid or has expired.</p>;
}

function MissingTokenMessage() {
  return <p className="text-sm text-muted-foreground">This invitation link is missing its token.</p>;
}

function ExistingAccountMessage({ companyName }: { companyName: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      An account already exists for the email this invitation to <strong className="text-foreground">{companyName}</strong> was
      sent to. Sign in with that account, then reopen this invitation link.
    </p>
  );
}

interface AcceptInvitePageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function AcceptInvitePage({ searchParams }: AcceptInvitePageProps) {
  const { token } = await searchParams;

  return (
    <main className="mx-auto flex min-h-screen max-w-sm flex-col justify-center px-4 py-12">
      <h1 className="mb-6 text-lg font-semibold text-foreground">Accept invitation</h1>
      {await renderBody(token)}
    </main>
  );
}

async function renderBody(token: string | undefined) {
  if (!token) {
    return <MissingTokenMessage />;
  }
  // Reject an oversized raw token before it's hashed or looked up --
  // token is untrusted, client-originated input (this page's own query
  // string). Same bound the two accept-invite actions independently
  // enforce before their own getValidInvite()/hashInviteToken() calls.
  if (token.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return <InvalidInviteMessage />;
  }

  const invite = await getValidInvite(token);
  if (!invite) {
    return <InvalidInviteMessage />;
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });

  if (existingUser) {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === existingUser.id) {
      return <ExistingMemberConfirmForm token={token} companyName={invite.companyName} />;
    }
    return <ExistingAccountMessage companyName={invite.companyName} />;
  }

  return <AcceptInviteForm token={token} email={invite.email} companyName={invite.companyName} />;
}
