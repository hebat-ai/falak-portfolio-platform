import { db } from "@/lib/db";
import { getValidInvestorInvite } from "@/lib/auth/investor-invite-lookup";
import { getCurrentUser } from "@/lib/auth/current-user";
import { MAX_RAW_INVITE_TOKEN_LENGTH } from "@/lib/auth/utils";
import { AcceptInvestorInviteForm } from "./AcceptInvestorInviteForm";
import { ExistingInvestorMemberConfirmForm } from "./ExistingInvestorMemberConfirmForm";

function InvalidInviteMessage() {
  return <p className="text-sm text-muted-foreground">This invitation link is invalid or has expired.</p>;
}

function MissingTokenMessage() {
  return <p className="text-sm text-muted-foreground">This invitation link is missing its token.</p>;
}

function ExistingAccountMessage({ investorName }: { investorName: string }) {
  return (
    <p className="text-sm text-muted-foreground">
      An account already exists for the email this invitation to <strong className="text-foreground">{investorName}</strong>{" "}
      was sent to. Sign in with that account, then reopen this invitation link.
    </p>
  );
}

// Mirrors /accept-invite exactly, for investor organizations. Choosing
// which form to render here is a UI convenience only -- both actions
// re-validate everything themselves, and the atomic claim inside their
// transaction is the real authorization.
export default async function AcceptInvestorInvitePage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
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
  if (token.length > MAX_RAW_INVITE_TOKEN_LENGTH) {
    return <InvalidInviteMessage />;
  }

  const invite = await getValidInvestorInvite(token);
  if (!invite) {
    return <InvalidInviteMessage />;
  }

  const existingUser = await db.user.findUnique({ where: { email: invite.email } });

  if (existingUser) {
    const currentUser = await getCurrentUser();
    if (currentUser && currentUser.id === existingUser.id) {
      return <ExistingInvestorMemberConfirmForm token={token} investorName={invite.investorName} />;
    }
    return <ExistingAccountMessage investorName={invite.investorName} />;
  }

  return <AcceptInvestorInviteForm token={token} email={invite.email} investorName={invite.investorName} />;
}
