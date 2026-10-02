-- ============================================================
-- Rollback of 20261002164959_add_row_level_security.
--
-- Enabling RLS on these 8 tables broke every query path that does NOT
-- go through withRlsContext (src/lib/db.ts): without
-- `app.current_user_id` set, app_is_falak_staff() / app_can_read_cycle()
-- / app_can_read_report() can never return true, so app_runtime saw ZERO
-- rows from any plain `db.<model>.*` call against these tables --
-- confirmed directly (SET ROLE app_runtime; SELECT count(*) FROM
-- reporting_cycles; returned 0 with RLS on, real rows with it off).
--
-- Only 6 functions were migrated to withRlsContext when this was first
-- enabled; dozens of others across admin/review/publish/investor/
-- reminder code paths were not, and would all have silently returned
-- empty data in production.
--
-- Disabling RLS here restores exactly the pre-migration behavior.
-- The helper functions (app_current_user_id, app_is_falak_staff,
-- app_can_read_cycle, app_can_read_report) and withRlsContext itself are
-- left in place -- they're harmless no-ops while RLS is off, and are the
-- correct foundation for a real follow-up pass that migrates EVERY
-- query path touching these tables in one coordinated change, not a
-- bounded subset.
-- ============================================================

ALTER TABLE reporting_cycles DISABLE ROW LEVEL SECURITY;
ALTER TABLE company_submissions DISABLE ROW LEVEL SECURITY;
ALTER TABLE submission_metric_values DISABLE ROW LEVEL SECURITY;
ALTER TABLE reports DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_versions DISABLE ROW LEVEL SECURITY;
ALTER TABLE narrative_sections DISABLE ROW LEVEL SECURITY;
ALTER TABLE report_access_grants DISABLE ROW LEVEL SECURITY;
ALTER TABLE attachments DISABLE ROW LEVEL SECURITY;
