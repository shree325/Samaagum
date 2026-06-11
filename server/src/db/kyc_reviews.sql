-- =====================================================================
-- Samaagum  |  Table: kyc_reviews
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS kyc_reviews CASCADE;

CREATE TABLE kyc_reviews (
  -- phase: MVP-1 | Admin review decision on a KYC submission
  id                UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id         UUID        NOT NULL REFERENCES tenants(id),
  submission_id     UUID        NOT NULL REFERENCES kyc_submissions(id),
  reviewer_user_id  UUID        REFERENCES users(id),
  decision          TEXT        NOT NULL DEFAULT 'pending',
  notes             TEXT,
  decided_at        timestamptz,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE kyc_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON kyc_reviews
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_kyc_reviews_updated ON kyc_reviews;
CREATE TRIGGER trg_kyc_reviews_updated
  BEFORE UPDATE ON kyc_reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE kyc_reviews               IS 'phase:MVP-1';
