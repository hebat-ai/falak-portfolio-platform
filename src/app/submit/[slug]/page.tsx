import { notFound, redirect } from "next/navigation";
import { db } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth/current-user";
import { getCurrentSubmissionForCompanyMember } from "@/lib/reporting/submissions";
import { listSubmissionAttachments } from "@/lib/reporting/attachments";
import { ForbiddenError, UnauthenticatedError } from "@/lib/auth/authorization-errors";
import { StartupReportForm } from "../_components/StartupReportForm";

// Real authentication and authorization, replacing this page's former
// "any valid company slug resolves here with no auth check" prototype
// behavior. `notFound()` is deliberately used for BOTH "no company with
// this slug" and "authenticated, but not a member of this company" --
// collapsing the two so this page never reveals which real company slugs
// exist to a visitor who isn't a member of them.
export default async function SubmitReportPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const company = await db.company.findUnique({
    where: { slug },
    select: { id: true, slug: true, nameEn: true, nameAr: true, currency: true, archivedAt: true },
  });

  if (!company || company.archivedAt) {
    notFound();
  }

  const currentUser = await getCurrentUser();
  if (!currentUser) {
    redirect(`/sign-in`);
  }

  let submission;
  try {
    submission = await getCurrentSubmissionForCompanyMember(company.id);
  } catch (error) {
    // ForbiddenError: authenticated, but not a member -- notFound(), same
    // as an unknown slug, so this page never confirms which real company
    // slugs exist to a non-member. UnauthenticatedError: defensive only
    // (the getCurrentUser() check above already redirects this case);
    // handled the same way in case the session changes between the two
    // calls.
    if (error instanceof ForbiddenError || error instanceof UnauthenticatedError) {
      notFound();
    }
    throw error;
  }

  const attachments = submission ? await listSubmissionAttachments(submission.id) : [];

  return (
    <StartupReportForm
      company={{ id: company.id, slug: company.slug, nameEn: company.nameEn, nameAr: company.nameAr, currency: company.currency }}
      submission={submission}
      attachments={attachments}
    />
  );
}
