-- =====================================================================
-- Migration 010: Media & Community Content
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID REFERENCES entities(id),
  owner_user_id UUID REFERENCES users(id),
  storage_key TEXT NOT NULL,
  mime TEXT,
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  event_id UUID REFERENCES events(id),
  title TEXT,
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE gallery_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id),
  asset_id UUID NOT NULL REFERENCES media_assets(id),
  caption TEXT,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  scope_type TEXT NOT NULL,
  scope_id UUID NOT NULL,
  author_user_id UUID NOT NULL REFERENCES users(id),
  title TEXT,
  body TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  post_id UUID NOT NULL REFERENCES forum_posts(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  status content_status NOT NULL DEFAULT 'active',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE wishlists (
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);
