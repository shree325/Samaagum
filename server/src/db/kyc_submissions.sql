-- =====================================================================
-- Samaagum  |  Table: kyc_submissions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS kyc_submissions CASCADE;

CREATE TABLE kyc_submissions (
  -- phase: MVP-1 | KYC document submission for an entity
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  entity_id       UUID        NOT NULL REFERENCES entities(id),
  submitted_by    UUID        REFERENCES users(id),
  documents       JSONB,
  state           TEXT        NOT NULL DEFAULT 'submitted',
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_kyc_submissions_entity_id ON kyc_submissions (entity_id);

-- Row-Level Security
ALTER TABLE kyc_submissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kyc_submissions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_kyc_submissions_updated ON kyc_submissions;
CREATE TRIGGER trg_kyc_submissions_updated
  BEFORE UPDATE ON kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE kyc_submissions           IS 'phase:MVP-1';
