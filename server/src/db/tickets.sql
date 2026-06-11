-- =====================================================================
-- Samaagum  |  Table: tickets
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS tickets CASCADE;

CREATE TABLE tickets (
  -- phase: MVP-0 | Individual issued ticket (one per attendee seat)
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID            NOT NULL REFERENCES tenants(id),
  line_item_id          UUID            NOT NULL REFERENCES booking_line_items(id),
  attendee_name         TEXT,
  attendee_email        CITEXT,
  attendee_gender       TEXT,
  -- qr_token: unique token encoded in QR code for scanning
  qr_token              TEXT            UNIQUE NOT NULL,
  status                ticket_status   NOT NULL DEFAULT 'reserved',
  claimed_by_user_id    UUID            REFERENCES users(id),
  created_at            timestamptz     NOT NULL DEFAULT now(),
  updated_at            timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_tickets_line_item_id ON tickets (line_item_id);
CREATE INDEX idx_tickets_qr_token ON tickets (qr_token);

-- Row-Level Security
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON tickets
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_tickets_updated ON tickets;
CREATE TRIGGER trg_tickets_updated
  BEFORE UPDATE ON tickets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE tickets                   IS 'phase:MVP-0';
