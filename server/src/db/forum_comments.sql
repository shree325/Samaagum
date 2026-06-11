-- =====================================================================
-- Samaagum  |  Table: forum_comments
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS forum_comments CASCADE;

CREATE TABLE forum_comments (
  -- phase: MVP-0 | Comment on a forum post
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  post_id         UUID            NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  author_user_id  UUID            NOT NULL REFERENCES users(id),
  body            TEXT,
  status          content_status  NOT NULL DEFAULT 'active',
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_forum_comments_post_id ON forum_comments (post_id);

-- Row-Level Security
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON forum_comments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_forum_comments_updated ON forum_comments;
CREATE TRIGGER trg_forum_comments_updated
  BEFORE UPDATE ON forum_comments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE forum_comments            IS 'phase:MVP-0';
