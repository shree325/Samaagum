-- =====================================================================
-- Migration 002: Identity & Profiles
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  primary_email CITEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  state user_state NOT NULL DEFAULT 'provisional',
  locale TEXT NOT NULL DEFAULT 'en',
  preferred_currency currency_code,
  gender TEXT,
  dob DATE,
  phone_e164 TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  activated_at TIMESTAMPTZ,
  deleted_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (tenant_id, primary_email)
);

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_uid TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (provider, provider_uid)
);

CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT
);

-- profiles.photo_asset_id and cover_asset_id FK deferred to migration 900
CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  display_name TEXT,
  bio TEXT,
  photo_asset_id UUID,
  cover_asset_id UUID,
  preferred_location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  template_key TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  label TEXT,
  value TEXT,
  position INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'public'
);

CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  PRIMARY KEY (user_id, category_id)
);

CREATE TABLE profile_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_key TEXT NOT NULL,
  level requirement_level NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all_users',
  revalidate_after INTERVAL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE profile_requirement_status (
  user_id UUID NOT NULL REFERENCES users(id),
  requirement_id UUID NOT NULL REFERENCES profile_requirements(id),
  status requirement_status NOT NULL DEFAULT 'unsatisfied',
  satisfied_at TIMESTAMPTZ,
  last_prompted_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, requirement_id)
);
