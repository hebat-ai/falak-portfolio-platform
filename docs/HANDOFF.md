# Falak Portfolio Platform — Handoff

This doc exists to get a new collaborator oriented fast: what this project
is, what's actually built (vs. still mock), the conventions the codebase
has been held to, and the concrete plan for what's next.

## What this is

An investor-reporting backend for Falak (a VC firm): portfolio companies
submit quarterly metrics, Falak Operations/Admin reviews and approves
them, Admin publishes a report, and investors see only the reports
they've actually been granted access to. Stack: **Next.js 16** (App
Router, Server Actions), **Prisma 7** (driver-adapter pattern, not the
classic client), **Auth.js v5** (passwordless, email-link sign-in only —
no passwords anywhere), Postgres on **Neon**, deployed on **Vercel**.

## Read this before writing any code

`AGENTS.md` at the repo root says it plainly: **this is not the Next.js
you know.** Next 16 and Prisma 7 both have breaking changes from what's
in most training data. Before touching a file in an unfamiliar area,
check `node_modules/next/dist/docs/` for the relevant guide. This is not
optional — several early mistakes in this project's history came from
assuming older Next.js/Prisma conventions.

## Architecture conventions (established, not optional)

- **Server Actions, not API routes**, for every mutation. Each one
  re-derives authorization itself — never trusts an earlier page-level
  check, even one that ran moments earlier in the same request chain.
- **Auth layer**: `src/lib/auth/authorization.ts` —
  `requireCurrentUser()` / `requireFalakRole(role)` /
  `requireCompanyMembership(companyId, role)` /
  `requireInvestorMembership(investorId, role)`, each throwing
  `UnauthenticatedError` or `ForbiddenError`
  (`src/lib/auth/authorization-errors.ts`). Server Actions catch these via
  the shared helper `src/lib/auth/action-error.ts` and return one generic
  "access denied / session expired" message rather than crashing —
  sessions are short-lived (15 min JWT `maxAge`), so this comes up often
  in testing.
- **State transitions are atomic conditional `updateMany`s**, not
  read-then-write: the `WHERE` clause pins the exact prior status (and
  the related company/investor's `archivedAt: null`), and a `count !== 1`
  means the transition didn't happen — this is the concurrency-safety
  pattern used everywhere (submission → review → approval → publish).
  See `src/lib/reporting/review-workflow.ts` for the clearest example.
- **Audit trail**: every meaningful mutation calls
  `writeAuditEvent(tx, {...})` (`src/lib/audit/write-audit-event.ts`) as
  the *last* statement inside the same transaction as the mutation it
  records — an append-only `AuditEvent`/`audit_events` table
  (SELECT/INSERT-only grants in `app_runtime_grants.sql`).
- **Testing methodology**: `node --test`, no test framework, no
  mocking library. `tests/support/mock-loader.mjs` is a Node ESM loader
  hook that stubs only true I/O boundaries (`server-only`, `@/lib/db`,
  `@/lib/auth/current-user`, `@/lib/email/send-email`, `next/navigation`)
  — every other `@/...` import resolves to the real, unmodified source.
  Tests exercise real production logic, never a re-simulated version of
  it. Shared fixtures/stub factories live in `tests/support/stubs.ts`.
- **Mock-data isolation**: several pages (`/company`, `/vehicle`, and
  `/investor` until Step 13) are still on the original fabricated-data
  prototype (`src/lib/mock/*`). When converting a page to real data, the
  established rule is: **build a parallel, real-DTO-typed component
  instead of touching the shared mock-typed one** (see
  `AdminCompanyTable.tsx` vs. the original shared `CompanyTable.tsx`).
  Never partially convert a shared component out from under pages that
  still depend on its mock typing.

## Working conventions this project has been held to

These aren't written into a config file anywhere — they were established
through direct instruction over the course of development, and matter as
much as the code itself:

- **Plan first, on anything non-trivial.** No schema/DB changes, and no
  meaningful feature work, without an explicit written plan the project
  owner signs off on first.
- **Never commit, push, or deploy unless explicitly asked**, each as its
  own explicit ask — "commit and push" is not "and also deploy."
- **Secret-scan staged changes before every commit** — grep the staged
  diff for API keys/tokens/passwords/connection strings before running
  `git commit`.
- **"It works" is not verification for a DB-mutating flow.** Confirm
  directly against the database with a read-only query (see any recent
  commit's testing notes) — a session-expiry issue or a stale
  client-side router cache has repeatedly made a working flow *look*
  broken, and vice versa.
- **Never take a destructive/irreversible action** (`git reset --hard`,
  force-push, dropping data) without it being explicitly requested for
  that specific instance.

## What's built so far

Roughly, in build order (see `git log --oneline` for the literal
commits):

1. **Foundation** — Prisma schema (see `prisma/schema.prisma` — every
   model has explanatory comments on non-obvious design choices, e.g. why
   duplicate-report prevention is 4 partial unique indexes, not
   `@@unique`), Neon connection setup, `app_runtime_grants.sql`.
2. **Auth** — server-side authorization layer, then a full pivot from
   password sign-in to passwordless email-link sign-in
   (`EmailVerificationToken`, Resend for delivery).
3. **Company submission workflow** — `/submit/[slug]`: a company member
   fills in metrics, submits (atomic `draft/changes_requested →
   submitted` transition with completeness checks).
4. **Admin workspace** (`/admin`) — real CRUD for companies, vehicles,
   investors, ownership links, reporting templates/cycles, and company
   invites — all real data, replacing the original mock admin UI.
5. **Review workflow** (`/review`) — real `submitted → under_review →
   changes_requested/approved` transitions
   (`src/lib/reporting/review-workflow.ts`).
6. **Narrative authoring + publish** — an `approved` submission can be
   published: creates/updates a `Report`/`ReportVersion`, attaches
   narrative sections, and grants investor access resolved from the real
   ownership graph (`src/lib/reporting/publish-workflow.ts`).
7. **Audit logging** — every mutation above now writes an `AuditEvent`
   row (`src/lib/audit/write-audit-event.ts`).
8. **Session-expiry hardening** — Server Actions catch auth errors
   gracefully instead of crashing on an expired session.

**Still on the original fabricated-data prototype, not yet converted:**
`/company`, `/vehicle`, `/vehicle/[slug]`, `/company/[slug]`, and
`/investor` (in progress — see below). Also untouched by any application
code anywhere: `Attachment`, `ReportDistribution`,
`AgreementCashFlow`, `InvestorCapitalTransaction`,
`CompanyValuationSnapshot`, `VehicleNavSnapshot`, `FxRate`,
`ReportingObligation`, `ReportingCycleObligation`,
`ReportingCycleDeadlineExtension`, `SubmissionVersionMetricValue` — all
already exist in the schema, none have a real query/mutation against them
yet.

## What's next: Step 13 — Investor Dashboard (real data)

Fully planned, not yet implemented. Converts `/investor` from mock data
to the real `InvestorMembership → ReportAccessGrant → ReportVersion`
chain Step 6 (`publish-workflow.ts`) already populates — including fixing
a real security gap in the current mock (its org picker lists *every*
investor in the system, not just the signed-in user's own).

Full design (DTOs, query shape, edge cases like an investor holding two
simultaneous grants on different versions of the same report, test plan)
is written out in detail and ready to execute — ask the project owner for
the current plan file, or regenerate the same design by asking to
"convert `/investor` to real data" and pointing at this handoff doc plus
`src/lib/admin/queries.ts` / `src/lib/admin/dto.ts` as the reference
pattern to mirror (that's exactly how this plan was derived).

Key points anyone picking this up needs to know:
- An investor must only ever see the metric value belonging to the exact
  `ReportVersion` they hold a valid, non-revoked grant for — never a
  company's live/in-progress submission.
- `ReportAccessGrant` is never revoked or migrated when a report is
  superseded — an investor can hold grants on two different versions of
  the same report at once; show only the highest `versionNo` per
  `(investor, report)`.
- No `/company/[slug]` link from the investor view, ever (existing code
  comment: "the internal Company Report page must not be reachable from
  this read-only view").
- Build a new `InvestorCompanyTable.tsx`, don't touch the shared
  `CompanyTable.tsx`.

After that: converting `/company`/`/vehicle` to real data, and deciding
whether the still-untouched schema models above (distributions,
attachments, cash flows, valuation/NAV snapshots, FX rates) represent
real near-term product needs or can stay dormant.

## Environment / access needed

Not included here (secrets don't belong in a repo doc) — get these from
the project owner directly:

- **GitHub**: collaborator access on this repo.
- **Vercel**: team access (project owner's Vercel team is currently on
  the Hobby plan, which may not support inviting additional members —
  confirm with the owner; may need an upgrade or a separate deploy setup).
- **Neon**: project access (invited via the Neon console).
- **Local `.env.local`** needs (names only, get real values from the
  owner or Vercel's env var dashboard): `DATABASE_URL`,
  `DATABASE_URL_UNPOOLED`, `RESEND_API_KEY`, `AUTH_SECRET`,
  `APP_BASE_URL`, plus the `DATABASE_*` Neon-integration variables Vercel
  injects automatically if pulling env vars via `vercel env pull`.

## Running it

```bash
npm install
npx prisma generate
npm run test          # full suite, no live DB needed — everything's stubbed at the I/O boundary
npx tsc --noEmit
npx eslint .
npm run dev            # needs a real DATABASE_URL in .env.local
```
