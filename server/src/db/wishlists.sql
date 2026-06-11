-- =====================================================================
-- Samaagum  |  Table: wishlists
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS wishlists CASCADE;

CREATE TABLE wishlists (
  -- phase: MVP-0 | User's saved/bookmarked events
  user_id     UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  event_id    UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  created_at  timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

-- Indexes
CREATE INDEX idx_wishlists_event_id ON wishlists (event_id);

-- Row-Level Security
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON wishlists
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE wishlists                 IS 'phase:MVP-0';
