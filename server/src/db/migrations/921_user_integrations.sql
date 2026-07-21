CREATE TABLE IF NOT EXISTS user_integrations (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  provider         VARCHAR(50) NOT NULL,
  access_token     TEXT NOT NULL,
  refresh_token    TEXT,
  expires_at       TIMESTAMPTZ,
  provider_user_id VARCHAR(255),
  email            VARCHAR(255),
  created_at       TIMESTAMPTZ DEFAULT NOW(),
  updated_at       TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, provider)
);
