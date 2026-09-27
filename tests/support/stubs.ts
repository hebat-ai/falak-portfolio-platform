/**
 * Shared, minimal stand-ins for the two real I/O dependencies intercepted
 * by mock-loader.mjs (`@/lib/db`'s `db` and `@/lib/auth/current-user`'s
 * `getCurrentUser`). Every test file sets `globalThis.__TEST_DB_STUB__`
 * and `globalThis.__TEST_GET_CURRENT_USER_STUB__` before dynamically
 * importing the real production module under test, so each test gets a
 * fresh, independent stub -- nothing here ever touches a real database.
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
