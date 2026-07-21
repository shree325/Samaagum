-- =====================================================================
-- Samaagum  |  Discussion Forum — Migration
-- Run once against the live database:
--   psql -U <user> -d <db> -f server/src/db/discussion_migration.sql
-- =====================================================================

-- ── 1. Extend forum_posts ──────────────────────────────────────────
ALTER TABLE forum_posts
  ADD COLUMN IF NOT EXISTS solved       BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived     BOOLEAN      NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS view_count   INT          NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deleted_at   TIMESTAMPTZ;

-- ── 2. Extend forum_comments (nested replies + soft delete) ────────
ALTER TABLE forum_comments
  ADD COLUMN IF NOT EXISTS parent_id  UUID REFERENCES forum_comments(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;

CREATE INDEX IF NOT EXISTS idx_forum_comments_parent   ON forum_comments(parent_id);
CREATE INDEX IF NOT EXISTS idx_forum_comments_post_del ON forum_comments(post_id, deleted_at);

-- ── 3. Normalised tag tables ───────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_tags (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID        NOT NULL,
  scope_id   UUID        NOT NULL,          -- entity_id of the group/community
  scope_type VARCHAR(20) NOT NULL DEFAULT 'group',
  name       VARCHAR(50) NOT NULL,
  color      VARCHAR(20) NOT NULL DEFAULT 'gray',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(scope_id, name)
);
CREATE INDEX IF NOT EXISTS idx_forum_tags_scope ON forum_tags(scope_id);

CREATE TABLE IF NOT EXISTS forum_post_tags (
  post_id UUID NOT NULL REFERENCES forum_posts(id) ON DELETE CASCADE,
  tag_id  UUID NOT NULL REFERENCES forum_tags(id)  ON DELETE CASCADE,
  PRIMARY KEY (post_id, tag_id)
);
CREATE INDEX IF NOT EXISTS idx_forum_post_tags_tag ON forum_post_tags(tag_id);

-- ── 4. Votes (threads + comments) ─────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_votes (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   UUID         NOT NULL,
  target_type VARCHAR(10)  NOT NULL,   -- 'post' | 'comment'
  vote        SMALLINT     NOT NULL,   --  1 = up | -1 = down
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type)
);
CREATE INDEX IF NOT EXISTS idx_forum_votes_target ON forum_votes(target_id, target_type);

-- ── 5. Emoji reactions ────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS forum_reactions (
  id          UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID         NOT NULL,
  user_id     UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  target_id   UUID         NOT NULL,
  target_type VARCHAR(10)  NOT NULL,   -- 'post' | 'comment'
  emoji       VARCHAR(10)  NOT NULL,
  created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, target_id, target_type, emoji)
);
CREATE INDEX IF NOT EXISTS idx_forum_reactions_target ON forum_reactions(target_id, target_type);

-- ── 6. Per-group "selected members" thread/reply permissions ──────
CREATE TABLE IF NOT EXISTS forum_member_permissions (
  id         UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id  UUID         NOT NULL,
  group_id   UUID         NOT NULL,   -- entity_id of the group
  user_id    UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  perm_type  VARCHAR(20)  NOT NULL,   -- 'create_thread' | 'reply_thread'
  created_at TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
  UNIQUE(group_id, user_id, perm_type)
);
CREATE INDEX IF NOT EXISTS idx_forum_member_perm_group ON forum_member_permissions(group_id, perm_type);
