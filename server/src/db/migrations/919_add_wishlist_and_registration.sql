-- =====================================================================
-- Migration 919: Add Wishlist, Registration Logs and Ticket Code
-- =====================================================================

-- 1. Add registration status to events table
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS registration_status TEXT NOT NULL DEFAULT 'OPEN' CHECK (registration_status IN ('OPEN', 'CLOSED', 'SCHEDULED')),
  ADD COLUMN IF NOT EXISTS registration_opens_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS registration_closes_at TIMESTAMPTZ;

-- 2. Create event_wishlist table
CREATE TABLE IF NOT EXISTS event_wishlist (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id         UUID        NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (event_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_event_wishlist_user   ON event_wishlist(user_id);
CREATE INDEX IF NOT EXISTS idx_event_wishlist_event  ON event_wishlist(event_id);

-- 3. Add registration audit log
CREATE TABLE IF NOT EXISTS event_registration_log (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id        UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  changed_by      UUID        NOT NULL REFERENCES users(id),
  action          TEXT        NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. Add ticket_code to tickets table
ALTER TABLE tickets
  ADD COLUMN IF NOT EXISTS ticket_code TEXT UNIQUE;
