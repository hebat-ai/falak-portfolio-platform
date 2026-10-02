-- ============================================================
-- Row-Level Security: tenant-isolation backstop
--
-- Scope (deliberately bounded, see docs/HANDOFF.md or the session plan
-- for the full reasoning): RLS is enabled on exactly the tables that
-- carry one company's or one investor's data, as a defense-in-depth
-- backstop against a future query that forgets a WHERE clause -- not a
-- SQL reimplementation of the whole role hierarchy. It has real effect
-- only for the `app_runtime` role (NOSUPERUSER, NOBYPASSRLS, and not the
-- table owner) -- `neondb_owner` (BYPASSRLS=true) is unaffected, which is
-- why migrations/admin tooling connecting as the owner keep working
-- exactly as before.
--
-- Every helper function below is SECURITY DEFINER with a pinned
-- search_path: its own internal queries run as the function's owner
-- (neondb_owner, BYPASSRLS), which is what lets a policy on, say,
-- reporting_cycles safely query reporting_cycles again inside its own
-- helper without recursing into itself through RLS.
-- ============================================================

CREATE OR REPLACE FUNCTION app_current_user_id() RETURNS text
LANGUAGE sql STABLE
AS $$
  SELECT current_setting('app.current_user_id', true);
$$;

CREATE OR REPLACE FUNCTION app_is_falak_staff() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM user_roles ur
    WHERE ur."userId" = app_current_user_id()
      AND ur.role IN ('FALAK_ADMIN', 'FALAK_OPERATIONS')
      AND ur."revokedAt" IS NULL
  );
$$;

-- Company-member read access to one cycle, by cycle id -- covers both
-- reporting_cycles itself and anything that hangs off a cycleId.
CREATE OR REPLACE FUNCTION app_can_read_cycle(cycle_id text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app_is_falak_staff()
    OR EXISTS (
      SELECT 1 FROM reporting_cycles rc
      JOIN company_memberships cm ON cm."companyId" = rc."companyId"
      WHERE rc.id = cycle_id
        AND cm."userId" = app_current_user_id()
        AND cm."revokedAt" IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM reporting_cycles rc
      JOIN reports r ON r."companyId" = rc."companyId"
        AND r."periodStart" = rc."periodStart"
        AND r."periodEnd" = rc."periodEnd"
      JOIN report_versions rv ON rv."reportId" = r.id
      JOIN report_access_grants rag ON rag."reportVersionId" = rv.id
      JOIN investor_memberships im ON im."investorId" = rag."investorId"
      WHERE rc.id = cycle_id
        AND rag."revokedAt" IS NULL
        AND im."userId" = app_current_user_id()
        AND im."revokedAt" IS NULL
    );
$$;

-- Read access to one Report, by report id -- staff, the report's own
-- company member, or an investor granted any version of it.
CREATE OR REPLACE FUNCTION app_can_read_report(report_id text) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT
    app_is_falak_staff()
    OR EXISTS (
      SELECT 1 FROM reports r
      JOIN company_memberships cm ON cm."companyId" = r."companyId"
      WHERE r.id = report_id
        AND cm."userId" = app_current_user_id()
        AND cm."revokedAt" IS NULL
    )
    OR EXISTS (
      SELECT 1 FROM report_versions rv
      JOIN report_access_grants rag ON rag."reportVersionId" = rv.id
      JOIN investor_memberships im ON im."investorId" = rag."investorId"
      WHERE rv."reportId" = report_id
        AND rag."revokedAt" IS NULL
        AND im."userId" = app_current_user_id()
        AND im."revokedAt" IS NULL
    );
$$;

-- ============================================================
-- reporting_cycles
-- ============================================================
ALTER TABLE reporting_cycles ENABLE ROW LEVEL SECURITY;
CREATE POLICY reporting_cycles_tenant_isolation ON reporting_cycles
  FOR ALL
  USING (app_can_read_cycle(id))
  WITH CHECK (app_can_read_cycle(id));

-- ============================================================
-- company_submissions
-- ============================================================
ALTER TABLE company_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY company_submissions_tenant_isolation ON company_submissions
  FOR ALL
  USING (app_can_read_cycle("cycleId"))
  WITH CHECK (app_can_read_cycle("cycleId"));

-- ============================================================
-- submission_metric_values
-- ============================================================
ALTER TABLE submission_metric_values ENABLE ROW LEVEL SECURITY;
CREATE POLICY submission_metric_values_tenant_isolation ON submission_metric_values
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM company_submissions cs
      WHERE cs.id = "submissionId" AND app_can_read_cycle(cs."cycleId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM company_submissions cs
      WHERE cs.id = "submissionId" AND app_can_read_cycle(cs."cycleId")
    )
  );

-- ============================================================
-- reports
-- ============================================================
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY reports_tenant_isolation ON reports
  FOR ALL
  USING (app_can_read_report(id))
  WITH CHECK (app_can_read_report(id));

-- ============================================================
-- report_versions
-- ============================================================
ALTER TABLE report_versions ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_versions_tenant_isolation ON report_versions
  FOR ALL
  USING (app_can_read_report("reportId"))
  WITH CHECK (app_can_read_report("reportId"));

-- ============================================================
-- narrative_sections
-- ============================================================
ALTER TABLE narrative_sections ENABLE ROW LEVEL SECURITY;
CREATE POLICY narrative_sections_tenant_isolation ON narrative_sections
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM report_versions rv
      WHERE rv.id = "reportVersionId" AND app_can_read_report(rv."reportId")
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM report_versions rv
      WHERE rv.id = "reportVersionId" AND app_can_read_report(rv."reportId")
    )
  );

-- ============================================================
-- report_access_grants -- an investor reads their OWN grants (to
-- discover which reports they're entitled to); staff read all.
-- ============================================================
ALTER TABLE report_access_grants ENABLE ROW LEVEL SECURITY;
CREATE POLICY report_access_grants_tenant_isolation ON report_access_grants
  FOR ALL
  USING (
    app_is_falak_staff()
    OR EXISTS (
      SELECT 1 FROM investor_memberships im
      WHERE im."investorId" = report_access_grants."investorId"
        AND im."userId" = app_current_user_id()
        AND im."revokedAt" IS NULL
    )
  )
  WITH CHECK (
    app_is_falak_staff()
    OR EXISTS (
      SELECT 1 FROM investor_memberships im
      WHERE im."investorId" = report_access_grants."investorId"
        AND im."userId" = app_current_user_id()
        AND im."revokedAt" IS NULL
    )
  );

-- ============================================================
-- attachments -- SUBMISSION-owned follows the cycle it belongs to;
-- REPORT_VERSION-owned follows the report it belongs to.
-- ============================================================
ALTER TABLE attachments ENABLE ROW LEVEL SECURITY;
CREATE POLICY attachments_tenant_isolation ON attachments
  FOR ALL
  USING (
    app_is_falak_staff()
    OR (
      "submissionId" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM company_submissions cs
        WHERE cs.id = "submissionId" AND app_can_read_cycle(cs."cycleId")
      )
    )
    OR (
      "reportVersionId" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM report_versions rv
        WHERE rv.id = "reportVersionId" AND app_can_read_report(rv."reportId")
      )
    )
  )
  WITH CHECK (
    app_is_falak_staff()
    OR (
      "submissionId" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM company_submissions cs
        WHERE cs.id = "submissionId" AND app_can_read_cycle(cs."cycleId")
      )
    )
    OR (
      "reportVersionId" IS NOT NULL
      AND EXISTS (
        SELECT 1 FROM report_versions rv
        WHERE rv.id = "reportVersionId" AND app_can_read_report(rv."reportId")
      )
    )
  );
