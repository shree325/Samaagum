-- =====================================================================
-- Samaagum  |  Table: waitlist_entries
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS waitlist_entries CASCADE;

CREATE TABLE waitlist_entries (
  -- phase: MVP-1 | Waitlist queue entry for a sold-out event/ticket type
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  event_id        UUID            NOT NULL REFERENCES events(id),
  ticket_type_id  UUID            REFERENCES ticket_types(id),
  user_id         UUID            NOT NULL REFERENCES users(id),
  position        INT,
  state           waitlist_state  NOT NULL DEFAULT 'queued',
  -- hold_payment_id FK deferred (after payments table)
  hold_payment_id UUID,
  created_at      timestamptz     NOT NULL DEFAULT now(),
  updated_at      timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_waitlist_entries_event_id ON waitlist_entries (event_id);
CREATE INDEX idx_waitlist_entries_user_id ON waitlist_entries (user_id);

-- Row-Level Security
ALTER TABLE waitlist_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON waitlist_entries
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_waitlist_entries_updated ON waitlist_entries;
CREATE TRIGGER trg_waitlist_entries_updated
  BEFORE UPDATE ON waitlist_entries
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE waitlist_entries          IS 'phase:MVP-1';
