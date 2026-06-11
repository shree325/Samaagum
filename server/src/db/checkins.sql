-- =====================================================================
-- Samaagum  |  Table: checkins
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS checkins CASCADE;

CREATE TABLE checkins (
  -- phase: MVP-0 | Check-in event record (QR scan, manual, etc.)
  id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID            NOT NULL REFERENCES tenants(id),
  ticket_id       UUID            NOT NULL REFERENCES tickets(id),
  method          checkin_method  NOT NULL,
  staff_user_id   UUID            NOT NULL REFERENCES users(id),
  gate            TEXT,
  reversed        BOOLEAN         NOT NULL DEFAULT false,
  occurred_at     timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_checkins_ticket_id ON checkins (ticket_id);

-- Row-Level Security
ALTER TABLE checkins ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON checkins
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE checkins                  IS 'phase:MVP-0';
