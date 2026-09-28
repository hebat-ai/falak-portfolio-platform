/**
 * Shared, minimal stand-ins for the real I/O dependencies intercepted by
 * mock-loader.mjs (`@/lib/db`'s `db`, `@/lib/auth/current-user`'s
 * `getCurrentUser`, and `@/lib/email/send-email`'s `sendSignInEmail`).
 * Every test file sets the matching `globalThis.__TEST_*_STUB__` before
 * dynamically importing the real production module under test, so each
 * test gets a fresh, independent stub -- nothing here ever touches a real
 * database or sends a real email.
 */

export interface StubUser {
  id: string;
  email: string;
}

export function setCurrentUser(user: StubUser | null): void {
  (globalThis as Record<string, unknown>).__TEST_GET_CURRENT_USER_STUB__ = async () => user;
}

export function setDbStub(stub: unknown): void {
  (globalThis as Record<string, unknown>).__TEST_DB_STUB__ = stub;
}

export interface SentEmail {
  to: string;
  verifyUrl: string;
}

/**
 * Installs a spy in place of sendSignInEmail and returns the array it
 * records calls into -- push-only, read by tests via .length/[0], never
 * mutated by the stub itself beyond appending.
 */
export function setSendEmailSpy(): SentEmail[] {
  const calls: SentEmail[] = [];
  (globalThis as Record<string, unknown>).__TEST_SEND_EMAIL_STUB__ = async (to: string, verifyUrl: string) => {
    calls.push({ to, verifyUrl });
  };
  return calls;
}

export const REAL_USER: StubUser = { id: "user_1", email: "a@b.com" };

interface MembershipFixture {
  userId: string;
  companyId?: string;
  investorId?: string;
  role: string;
  revoked?: boolean;
  archived?: boolean;
}

interface FalakRoleFixture {
  role: string;
  revoked?: boolean;
}

/**
 * Backs requireCurrentUser/requireFalakRole/requireCompanyMembership/
 * requireInvestorMembership (src/lib/auth/authorization.ts) exactly as
 * that real module queries them: userId/companyId/investorId equality,
 * `role: { in: [...] }`, `revokedAt: null`, and the related resource's
 * `archivedAt: null` via a relation filter.
 */
export function makeAuthorizationDbStub(options: {
  companyMembership?: MembershipFixture | null;
  investorMembership?: MembershipFixture | null;
  falakRoles?: FalakRoleFixture[];
  throwError?: Error;
}) {
  return {
    companyMembership: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (options.throwError) throw options.throwError;
        const m = options.companyMembership;
        if (!m) return null;
        if (where.userId !== m.userId) return null;
        if (where.companyId !== m.companyId) return null;
        if (m.revoked) return null;
        if (m.archived) return null;
        const roleFilter = where.role as { in: string[] };
        if (!roleFilter.in.includes(m.role)) return null;
        return { role: m.role };
      },
    },
    investorMembership: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        if (options.throwError) throw options.throwError;
        const m = options.investorMembership;
        if (!m) return null;
        if (where.userId !== m.userId) return null;
        if (where.investorId !== m.investorId) return null;
        if (m.revoked) return null;
        if (m.archived) return null;
        const roleFilter = where.role as { in: string[] };
        if (!roleFilter.in.includes(m.role)) return null;
        return { role: m.role };
      },
    },
    userRoleAssignment: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        if (options.throwError) throw options.throwError;
        const roleFilter = where.role as { in: string[] };
        return (options.falakRoles ?? [])
          .filter((r) => !r.revoked && roleFilter.in.includes(r.role))
          .map((r) => ({ role: r.role }));
      },
    },
  };
}

export interface SubmissionFixture {
  id: string;
  cycleCompanyId: string;
  templateId: string;
  status: string;
  periodLabel: string;
  periodStart: Date;
  periodEnd: Date;
  currentDeadline: Date;
  companyArchived?: boolean;
}

export interface MetricDefinitionFixture {
  id: string;
  templateId: string;
  isActive: boolean;
  required: boolean;
}

export interface SubmissionMetricValueFixture {
  submissionId: string;
  metricDefinitionId: string;
  isNa: boolean;
  numericValue: number | null;
  textValue: string | null;
}

/**
 * Backs getCurrentSubmissionForCompanyMember/submitCompanySubmission
 * (src/lib/reporting/submissions.ts) exactly as that real module queries
 * them. `submission.status` is genuinely mutated by the conditional
 * `updateMany` (only when its WHERE predicate matches, mirroring real
 * Prisma semantics -- including the exact-status pin), and `$transaction`
 * rolls back that mutation if its callback throws, simulating Prisma's
 * own interactive-transaction rollback for the one test that needs it.
 */
export function makeReportingDbStub(options: {
  membership: MembershipFixture | null;
  submission: SubmissionFixture | null;
  metricDefinitions?: MetricDefinitionFixture[];
  submissionMetricValues?: SubmissionMetricValueFixture[];
  eventCount?: number;
  throwOnEventCreate?: Error;
}) {
  const state: {
    submission: SubmissionFixture | null;
    eventCount: number;
    lastAppliedPrevStatus?: string;
    lastEventData?: Record<string, unknown>;
  } = {
    submission: options.submission ? { ...options.submission } : null,
    eventCount: options.eventCount ?? 0,
  };
  const metricDefinitions = options.metricDefinitions ?? [];
  const submissionMetricValues = options.submissionMetricValues ?? [];

  const stub = {
    companyMembership: {
      findFirst: async ({ where }: { where: Record<string, unknown> }) => {
        const m = options.membership;
        if (!m) return null;
        if (where.userId !== m.userId) return null;
        if (where.companyId !== m.companyId) return null;
        if (m.revoked) return null;
        if (m.archived) return null;
        const roleFilter = where.role as { in: string[] };
        if (!roleFilter.in.includes(m.role)) return null;
        return { role: m.role };
      },
    },
    userRoleAssignment: { findMany: async () => [] },
    metricDefinition: {
      findMany: async ({ where }: { where: { templateId: string; isActive: boolean } }) =>
        metricDefinitions.filter((d) => d.templateId === where.templateId && d.isActive === where.isActive),
    },
    submissionMetricValue: {
      findMany: async ({ where }: { where: { submissionId: string; metricDefinitionId: { in: string[] } } }) =>
        submissionMetricValues.filter(
          (v) => v.submissionId === where.submissionId && where.metricDefinitionId.in.includes(v.metricDefinitionId)
        ),
    },
    companySubmission: {
      findFirst: async ({ where }: { where: { id?: string; cycle?: { companyId?: string } } }) => {
        if (!state.submission) return null;
        if (where.id && where.id !== state.submission.id) return null;
        if (where.cycle?.companyId && where.cycle.companyId !== state.submission.cycleCompanyId) return null;
        return {
          id: state.submission.id,
          status: state.submission.status,
          cycle: {
            companyId: state.submission.cycleCompanyId,
            templateId: state.submission.templateId,
            periodLabel: state.submission.periodLabel,
            periodStart: state.submission.periodStart,
            periodEnd: state.submission.periodEnd,
            currentDeadline: state.submission.currentDeadline,
          },
        };
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; cycle: { companyId: string; company: { archivedAt: null } }; status: string };
        data: { status: string };
      }) => {
        if (!state.submission) return { count: 0 };
        if (where.id !== state.submission.id) return { count: 0 };
        if (where.cycle.companyId !== state.submission.cycleCompanyId) return { count: 0 };
        if (state.submission.companyArchived) return { count: 0 };
        if (where.status !== state.submission.status) return { count: 0 };
        state.lastAppliedPrevStatus = state.submission.status;
        state.submission.status = data.status;
        return { count: 1 };
      },
    },
    submissionWorkflowEvent: {
      count: async () => state.eventCount,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (options.throwOnEventCreate) throw options.throwOnEventCreate;
        state.eventCount += 1;
        state.lastEventData = data;
        return data;
      },
    },
    getLastEventData: () => state.lastEventData,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      try {
        return await fn(stub);
      } catch (err) {
        if (state.submission && state.lastAppliedPrevStatus !== undefined) {
          state.submission.status = state.lastAppliedPrevStatus;
        }
        throw err;
      } finally {
        state.lastAppliedPrevStatus = undefined;
      }
    },
  };
  return stub;
}

export interface SignInUserFixture {
  id: string;
  email: string;
  deactivatedAt?: Date | null;
}

export interface SignInTokenFixture {
  id: string;
  userId: string;
  tokenHash: string;
  expiresAt: Date;
  consumedAt?: Date | null;
}

/**
 * Backs requestSignInLink/consumeSignInToken/authorizeSignInToken exactly
 * as those real modules query them: `user.findUnique` by id or email, and
 * `emailVerificationToken.create`/`updateMany`/`findUnique` against a
 * genuinely mutated in-memory token list -- `updateMany`'s conditional
 * WHERE (tokenHash + consumedAt:null + expiresAt:{gt}) really only flips
 * `consumedAt` when it matches, mirroring Postgres semantics, so the same
 * atomic-claim behavior verify-sign-in.ts relies on is exercised for real.
 */
export function makeSignInDbStub(options: { users?: SignInUserFixture[]; tokens?: SignInTokenFixture[] } = {}) {
  const users = options.users ?? [];
  const tokens: SignInTokenFixture[] = (options.tokens ?? []).map((t) => ({ ...t }));
  let nextId = 0;

  return {
    user: {
      findUnique: async ({ where }: { where: { id?: string; email?: string } }) => {
        const user = users.find((u) => (where.id ? u.id === where.id : u.email === where.email));
        if (!user) return null;
        return { id: user.id, email: user.email, deactivatedAt: user.deactivatedAt ?? null };
      },
    },
    emailVerificationToken: {
      create: async ({ data }: { data: { userId: string; tokenHash: string; expiresAt: Date } }) => {
        const row: SignInTokenFixture = {
          id: `token_${++nextId}`,
          userId: data.userId,
          tokenHash: data.tokenHash,
          expiresAt: data.expiresAt,
          consumedAt: null,
        };
        tokens.push(row);
        return row;
      },
      updateMany: async ({
        where,
        data,
      }: {
        where: { tokenHash: string; consumedAt: null; expiresAt: { gt: Date } };
        data: { consumedAt: Date };
      }) => {
        const row = tokens.find((t) => t.tokenHash === where.tokenHash);
        if (!row) return { count: 0 };
        if (row.consumedAt) return { count: 0 };
        if (!(row.expiresAt.getTime() > where.expiresAt.gt.getTime())) return { count: 0 };
        row.consumedAt = data.consumedAt;
        return { count: 1 };
      },
      findUnique: async ({ where }: { where: { tokenHash: string } }) => {
        const row = tokens.find((t) => t.tokenHash === where.tokenHash);
        if (!row) return null;
        return { userId: row.userId };
      },
    },
    getTokens: () => tokens,
  };
}

export interface ReviewSubmissionFixture {
  id: string;
  status: string;
  companyArchived?: boolean;
}

/**
 * Backs startReview/requestChanges/approveSubmission
 * (src/lib/reporting/review-workflow.ts) exactly as that real module
 * queries them: `userRoleAssignment.findMany` for requireFalakRole, a
 * genuinely-conditional `companySubmission.updateMany` (mirroring
 * Postgres semantics -- only flips status when the WHERE actually
 * matches), `submissionWorkflowEvent.count`/`create`, and
 * `reviewComment.create`. `$transaction` rolls back the status change if
 * its callback throws (e.g. a failed reviewComment.create), simulating
 * Prisma's own interactive-transaction rollback -- the same technique
 * makeReportingDbStub uses for submitCompanySubmission.
 */
export function makeReviewWorkflowDbStub(options: {
  falakRoles?: FalakRoleFixture[];
  submission: ReviewSubmissionFixture | null;
  eventCount?: number;
  throwOnCommentCreate?: Error;
}) {
  const state: {
    submission: ReviewSubmissionFixture | null;
    eventCount: number;
    reviewComments: Record<string, unknown>[];
    lastEventData?: Record<string, unknown>;
    lastAppliedPrevStatus?: string;
    lastAppliedPrevEventCount?: number;
  } = {
    submission: options.submission ? { ...options.submission } : null,
    eventCount: options.eventCount ?? 0,
    reviewComments: [],
  };

  const stub = {
    userRoleAssignment: {
      findMany: async ({ where }: { where: Record<string, unknown> }) => {
        const roleFilter = where.role as { in: string[] };
        return (options.falakRoles ?? [])
          .filter((r) => !r.revoked && roleFilter.in.includes(r.role))
          .map((r) => ({ role: r.role }));
      },
    },
    companySubmission: {
      updateMany: async ({
        where,
        data,
      }: {
        where: { id: string; status: string };
        data: { status: string };
      }) => {
        if (!state.submission) return { count: 0 };
        if (where.id !== state.submission.id) return { count: 0 };
        if (state.submission.companyArchived) return { count: 0 };
        if (where.status !== state.submission.status) return { count: 0 };
        state.lastAppliedPrevStatus = state.submission.status;
        state.lastAppliedPrevEventCount = state.eventCount;
        state.submission.status = data.status;
        return { count: 1 };
      },
    },
    submissionWorkflowEvent: {
      count: async () => state.eventCount,
      create: async ({ data }: { data: Record<string, unknown> }) => {
        state.eventCount += 1;
        state.lastEventData = data;
        return data;
      },
    },
    reviewComment: {
      create: async ({ data }: { data: Record<string, unknown> }) => {
        if (options.throwOnCommentCreate) throw options.throwOnCommentCreate;
        state.reviewComments.push(data);
        return data;
      },
    },
    getSubmissionStatus: () => state.submission?.status,
    getEventCount: () => state.eventCount,
    getLastEventData: () => state.lastEventData,
    getReviewComments: () => state.reviewComments,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      try {
        return await fn(stub);
      } catch (err) {
        if (state.submission && state.lastAppliedPrevStatus !== undefined) {
          state.submission.status = state.lastAppliedPrevStatus;
        }
        if (state.lastAppliedPrevEventCount !== undefined) {
          state.eventCount = state.lastAppliedPrevEventCount;
        }
        throw err;
      } finally {
        state.lastAppliedPrevStatus = undefined;
        state.lastAppliedPrevEventCount = undefined;
      }
    },
  };
  return stub;
}
