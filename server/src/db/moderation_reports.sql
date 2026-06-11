-- =====================================================================
-- Samaagum  |  Table: moderation_reports
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS moderation_reports CASCADE;

CREATE TABLE moderation_reports (
  -- phase: MVP-0 | Content/user moderation report from a user
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  reporter_user_id  UUID        REFERENCES users(id),
  target_type       TEXT        NOT NULL,
  target_id         UUID        NOT NULL,
  reason            TEXT,
  state             TEXT        NOT NULL DEFAULT 'open',
  resolution        TEXT,
  handled_by        UUID        REFERENCES users(id),
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_moderation_reports_state ON moderation_reports (state);

-- Row-Level Security
ALTER TABLE moderation_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON moderation_reports
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_moderation_reports_updated ON moderation_reports;
CREATE TRIGGER trg_moderation_reports_updated
  BEFORE UPDATE ON moderation_reports
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE moderation_reports        IS 'phase:MVP-0';
