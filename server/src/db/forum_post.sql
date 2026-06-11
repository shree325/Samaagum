-- =====================================================================
-- Samaagum  |  Table: forum_posts
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS forum_posts CASCADE;

CREATE TABLE forum_posts (
  -- phase: MVP-0 | Discussion post scoped to a community/event/group
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  scope_type      TEXT            NOT NULL,
  scope_id        UUID            NOT NULL,
  author_user_id  UUID            NOT NULL REFERENCES users(id),
  title           TEXT,
  body            TEXT,
  pinned          BOOLEAN         NOT NULL DEFAULT false,
  status          content_status  NOT NULL DEFAULT 'active',
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_forum_posts_scope_id ON forum_posts (scope_id);

-- Row-Level Security
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON forum_posts
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_forum_posts_updated ON forum_posts;
CREATE TRIGGER trg_forum_posts_updated
  BEFORE UPDATE ON forum_posts
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE forum_posts               IS 'phase:MVP-0';
