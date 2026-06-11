-- =====================================================================
-- Samaagum  |  Table: reviews
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS reviews CASCADE;

CREATE TABLE reviews (
  -- phase: Phase-1.5 | User review of an event or entity
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  author_user_id  UUID            NOT NULL REFERENCES users(id),
  target_type     TEXT            NOT NULL,
  target_id       UUID            NOT NULL,
  body            TEXT,
  status          review_status   NOT NULL DEFAULT 'pending',
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON reviews
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_reviews_updated ON reviews;
CREATE TRIGGER trg_reviews_updated
  BEFORE UPDATE ON reviews
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE reviews                   IS 'phase:Phase-1.5';
