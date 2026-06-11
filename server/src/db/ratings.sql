-- =====================================================================
-- Samaagum  |  Table: ratings
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ratings CASCADE;

CREATE TABLE ratings (
  -- phase: Phase-1.5 | Numeric score per review dimension
  id              UUID      PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID      NOT NULL REFERENCES tenants(id),
  review_id       UUID      REFERENCES reviews(id),
  author_user_id  UUID      NOT NULL REFERENCES users(id),
  target_type     TEXT      NOT NULL,
  target_id       UUID      NOT NULL,
  dimension       TEXT      NOT NULL DEFAULT 'overall',
  score           SMALLINT  NOT NULL CHECK (score BETWEEN 1 AND 5)
);

-- Row-Level Security
ALTER TABLE ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ratings
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE ratings                   IS 'phase:Phase-1.5';
