-- =====================================================================
-- Samaagum  |  Table: signals
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS signals CASCADE;

CREATE TABLE signals (
  -- phase: MVP-0 | Behavioural signals for recommendation / ML features
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  user_id         UUID,
  signal_type     TEXT        NOT NULL,
  subject_type    TEXT,
  subject_id      UUID,
  occurred_at     timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_signals_subject_id ON signals (subject_id);
CREATE INDEX idx_signals_user_id ON signals (user_id);

-- Row-Level Security
ALTER TABLE signals ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON signals
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE signals                   IS 'phase:MVP-0';
