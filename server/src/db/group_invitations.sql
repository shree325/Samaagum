-- =====================================================================
-- Samaagum  |  Table: group_invitations
-- =====================================================================

CREATE TABLE IF NOT EXISTS group_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  group_id UUID NOT NULL REFERENCES groups(entity_id) ON DELETE CASCADE,
  
  -- Target can be email or username (or null for shareable open links)
  email TEXT,
  username TEXT,
  
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, accepted, expired, revoked
  
  -- Link configuration
  link_type TEXT NOT NULL DEFAULT 'single_use', -- single_use, multi_use
  max_uses INT,
  uses_count INT DEFAULT 0,
  
  expires_at TIMESTAMPTZ,
  accepted_at TIMESTAMPTZ,
  invited_by UUID REFERENCES users(id) ON DELETE SET NULL,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Indexes for quick duplication/validation checks
CREATE INDEX IF NOT EXISTS idx_group_invitations_group_target ON group_invitations (group_id, email, username);
CREATE INDEX IF NOT EXISTS idx_group_invitations_token ON group_invitations (token);
