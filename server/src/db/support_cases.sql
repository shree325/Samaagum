-- =====================================================================
-- Samaagum  |  Table: support_cases
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS support_cases CASCADE;

CREATE TABLE support_cases (
  -- phase: MVP-0 | Support ticket raised by a user
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  raised_by_user_id UUID        REFERENCES users(id),
  subject           TEXT,
  category          TEXT,
  state             TEXT        NOT NULL DEFAULT 'open',
  priority          TEXT        NOT NULL DEFAULT 'normal',
  related_type      TEXT,
  related_id        UUID,
  assigned_to       UUID        REFERENCES users(id),
  resolved_at       timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_support_cases_state ON support_cases (state);

-- Row-Level Security
ALTER TABLE support_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON support_cases
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_support_cases_updated ON support_cases;
CREATE TRIGGER trg_support_cases_updated
  BEFORE UPDATE ON support_cases
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE support_cases             IS 'phase:MVP-0';
