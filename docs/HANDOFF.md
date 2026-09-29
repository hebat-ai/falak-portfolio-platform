# Falak Portfolio Platform — Handoff

This doc exists to get a new collaborator oriented fast: what this project
is, what's actually built, the conventions the codebase has been held
to, and the open candidates for what's next.

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
- **One feature module per area**: `src/lib/{admin,investor,company,vehicle,submit}/`
  each own their `dto.ts` + `server-only` `queries.ts` (auth gate first,
  one fetch, plain serializable DTOs out), even where DTO shapes look
  alike — no cross-module DTO imports. Pages are async Server Components
  that gate + fetch, then hand DTOs to a `"use client"` component.
- **Overdue days** always come from `getOverdueDays` in
  `src/lib/reportingStatus.ts` (live clock), so every page agrees.

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
9. **Investor dashboard** (`/investor`) — only the signed-in user's own
   investor orgs; only published versions they hold a non-revoked grant
   for, highest `versionNo` per report (`src/lib/investor/`).
10. **Company register + report** (`/company`, `/company/[slug]`) — register
    is Falak-staff-only; a report is visible to Falak staff *or* that
    company's own members (403 collapses into 404 so slugs don't leak).
    First place narrative sections are rendered (`src/lib/company/`).
11. **Vehicle directory + dashboard** (`/vehicle`, `/vehicle/[slug]`) —
    Falak-staff-only (no per-vehicle membership model exists); periods
    scoped to the vehicle's own companies (`src/lib/vehicle/`).
12. **My Companies** (`/submit`) — each company the signed-in user is a
    member of, with its current period's status (`src/lib/submit/`). The
    mock-data layer (`src/lib/mock/`) is gone: every page reads real data.
13. **Investor invites** — `/admin` "Send Investor Invite" → one-time link
    → `/accept-investor-invite`, mirroring the company invite flow
    (`InvestorInvite` table, atomic claim in `investor-invite-claim.ts`).
    Accepting a fresh invite reactivates a previously revoked membership,
    for both company and investor invites.
14. **Access management** (`/admin/access`) — every company and investor
    org's active members and pending invites; FALAK_ADMIN can revoke a
    membership or cancel an invite (conditional update + audit), which
    takes effect on the person's next page load (`src/lib/access/`).

Untouched by any application
code anywhere: `Attachment`, `ReportDistribution`,
`AgreementCashFlow`, `InvestorCapitalTransaction`,
`CompanyValuationSnapshot`, `VehicleNavSnapshot`, `FxRate`,
`ReportingObligation`, `ReportingCycleObligation`,
`ReportingCycleDeadlineExtension`, `SubmissionVersionMetricValue` — all
already exist in the schema, none have a real query/mutation against them
yet.

## What's next

No step is planned yet. Open candidates:
- Decide whether the untouched schema models above (distributions,
  attachments, cash flows, valuation/NAV snapshots, FX rates) are real
  near-term product needs or can stay dormant.
- Report-access-grant revocation (an investor org's access to a specific
  published report; grants are only ever created today, in
  `publishSubmission`), and changing a member's role.
- Emailing investors when a report is published (`ReportDistribution`),
  and emailing invite links instead of copy-pasting them.
- Reporting deadline extensions (`ReportingCycleDeadlineExtension`).
- A company report opened from an *archived* vehicle's dashboard falls
  back to "Back to Company Reports" (the company's linked-vehicles list
  excludes archived vehicles).

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
