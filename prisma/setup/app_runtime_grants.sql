-- ============================================================
-- Falak Portfolio Platform -- app_runtime role setup
--
-- NOT part of the Prisma migration history. This file is applied
-- manually, once, directly against the target database (via the Neon
-- SQL console or `psql`) -- never through `prisma migrate dev/deploy`,
-- and never automatically.
--
-- Run this AFTER migration.sql has been applied, since every GRANT
-- below targets a table that migration.sql creates.
--
-- No password appears anywhere in this file or anywhere else in this
-- repository. CREATE ROLE below intentionally has no PASSWORD clause --
-- set the password out-of-band, directly against the database (Neon
-- console "Roles" tab, or an interactive `ALTER ROLE app_runtime WITH
-- PASSWORD '...'` typed into a psql session), and store only the
-- resulting connection string in the untracked .env.local, never in a
-- file that gets committed.
-- ============================================================

CREATE ROLE app_runtime LOGIN;
-- Set the password out-of-band (see header). Do not add a PASSWORD
-- clause here or in any committed file.

-- No ALTER ROLE follows intentionally. PostgreSQL documents the defaults
-- for CREATE ROLE as NOSUPERUSER, NOCREATEDB, NOCREATEROLE,
-- NOREPLICATION, NOBYPASSRLS, and a null password. A non-superuser
-- cannot alter the SUPERUSER property, even when restating NOSUPERUSER,
-- so the redundant ALTER ROLE would fail. Deployment and preflight
-- verify these safe defaults immediately after role creation.

GRANT USAGE ON SCHEMA public TO app_runtime;
-- No sequence grants needed: every id uses Prisma's cuid() default,
-- generated client-side -- this schema creates zero Postgres sequences.

-- Explicit revoke-first baseline: app_runtime starts with nothing on
-- every table, then gains only what's whitelisted below.
REVOKE ALL PRIVILEGES ON ALL TABLES IN SCHEMA public FROM app_runtime;

-- Master data: normal read/write, no DELETE.
GRANT SELECT, INSERT, UPDATE ON companies, vehicles, investors TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON users TO app_runtime;

-- user_roles: UPDATE narrowed to revokedAt only -- userId/role are the
-- row's identity; re-granting a role after revocation is a new row,
-- guarded by the user_roles_one_active_assignment partial unique index.
GRANT SELECT, INSERT ON user_roles TO app_runtime;
GRANT UPDATE ("revokedAt") ON user_roles TO app_runtime;

-- Invites: narrow to the two fields that legitimately change after
-- issuance.
GRANT SELECT, INSERT ON company_invites TO app_runtime;
GRANT UPDATE ("acceptedAt", "revokedAt") ON company_invites TO app_runtime;
GRANT SELECT, INSERT ON investor_invites TO app_runtime;
GRANT UPDATE ("acceptedAt", "revokedAt") ON investor_invites TO app_runtime;

-- Sign-in verification tokens: same narrow shape as company_invites --
-- only consumedAt legitimately changes after issuance.
GRANT SELECT, INSERT ON email_verification_tokens TO app_runtime;
GRANT UPDATE ("consumedAt") ON email_verification_tokens TO app_runtime;

-- Memberships: role can change (promote/demote), revokedAt ends access;
-- identity (userId + companyId/investorId) never changes after creation.
GRANT SELECT, INSERT ON company_memberships TO app_runtime;
GRANT UPDATE ("role", "revokedAt") ON company_memberships TO app_runtime;
GRANT SELECT, INSERT ON investor_memberships TO app_runtime;
GRANT UPDATE ("role", "revokedAt") ON investor_memberships TO app_runtime;

-- Vehicle-mediated investor positions: a commitment increase is a new
-- row, not an edit; only status is ever mutated on an existing row.
GRANT SELECT, INSERT ON investor_vehicle_positions TO app_runtime;
GRANT UPDATE ("status") ON investor_vehicle_positions TO app_runtime;

-- Ownership positions and snapshots: insert-only. Their columns are
-- exactly their identity / a point-in-time fact.
GRANT SELECT, INSERT ON ownership_positions, ownership_snapshots TO app_runtime;

-- Agreements: narrow UPDATE to fields that legitimately change after
-- signing (terminating sets status + effectiveTo; notes may be
-- corrected). Round-time financial/date facts never change.
GRANT SELECT, INSERT ON investment_agreements TO app_runtime;
GRANT UPDATE ("status", "effectiveTo", "informationRightsNotes") ON investment_agreements TO app_runtime;

-- Templates/metrics/obligations/cycles: broad UPDATE grant is safe here
-- BECAUSE the immutability triggers in migration.sql are the real,
-- conditional guard (immutable only once "in use" -- a fixed column-
-- level GRANT can't express that condition; the trigger is the correct
-- enforcement layer, not the grant).
GRANT SELECT, INSERT, UPDATE ON reporting_templates, metric_definitions, reporting_obligations, reporting_cycles TO app_runtime;
GRANT SELECT, INSERT ON reporting_cycle_obligations TO app_runtime;
GRANT SELECT, INSERT ON reporting_cycle_deadline_extensions TO app_runtime;

-- Submissions: the current-state record by design (distinct from the
-- append-only SubmissionWorkflowEvent log below).
GRANT SELECT, INSERT, UPDATE ON company_submissions TO app_runtime;
GRANT SELECT, INSERT, UPDATE ON submission_metric_values TO app_runtime;

-- Immutable versioned rows: insert-only, no exceptions. This is the
-- "submission_versions" versioning concept in its final, split form.
GRANT SELECT, INSERT ON submission_workflow_events, submission_version_metric_values TO app_runtime;

-- Review comments: body/status/resolution may change before/at
-- resolution; target identity (targetType + the four target FKs) must
-- never change after creation.
GRANT SELECT, INSERT ON review_comments TO app_runtime;
GRANT UPDATE ("body", "status", "resolvedAt", "resolvedById") ON review_comments TO app_runtime;

-- Attachments: insert-only. Even a filename correction is a re-upload
-- (a new row), never an edit to an existing evidentiary document.
GRANT SELECT, INSERT ON attachments TO app_runtime;

-- Reports: current-state record, same reasoning as company_submissions.
GRANT SELECT, INSERT, UPDATE ON reports TO app_runtime;

-- Report versions: insert-only except the specific lifecycle timestamps
-- a version legitimately gains after creation.
GRANT SELECT, INSERT ON report_versions, report_version_submissions, narrative_sections TO app_runtime;
GRANT UPDATE ("publishedAt", "distributedAt", "isSuperseded") ON report_versions TO app_runtime;

-- Access grants: narrow to revokedAt only.
GRANT SELECT, INSERT ON report_access_grants TO app_runtime;
GRANT UPDATE ("revokedAt") ON report_access_grants TO app_runtime;

-- Distributions: narrow to the delivery-status callback fields only.
GRANT SELECT, INSERT ON report_distributions TO app_runtime;
GRANT UPDATE ("status", "failureReason", "openedAt", "downloadedAt") ON report_distributions TO app_runtime;

-- Financial ledgers, valuation/NAV/FX marks: insert-only. A correction is
-- a new row, never an edit -- same discipline as the audit log.
GRANT SELECT, INSERT ON agreement_cash_flows, investor_capital_transactions,
  company_valuation_snapshots, vehicle_nav_snapshots, fx_rates TO app_runtime;

-- Audit log: append-only, no exceptions.
GRANT SELECT, INSERT ON audit_events TO app_runtime;

-- No table in this schema receives a DELETE grant.
