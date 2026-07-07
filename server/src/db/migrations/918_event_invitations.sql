-- =====================================================================
-- Samaagum  |  Table: event_invitations
-- One-time invite links for unlisted-visibility events ('view' purpose)
-- and invite-only join eligibility ('join' purpose).
-- =====================================================================

CREATE TABLE IF NOT EXISTS event_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES events(id) ON DELETE CASCADE,

  purpose TEXT NOT NULL, -- 'view' (unlisted visibility bypass) | 'join' (invite-only eligibility bypass)
  token TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, used, revoked

  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_by UUID REFERENCES users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_event_invitations_event ON event_invitations (event_id);
CREATE INDEX IF NOT EXISTS idx_event_invitations_token ON event_invitations (token);
