-- =====================================================================
-- Samaagum  |  Table: bookings
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS bookings CASCADE;

CREATE TABLE bookings (
  -- phase: MVP-0 | An order placed by a user for one or more tickets
  id                    UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id             UUID            NOT NULL REFERENCES tenants(id),
  event_id              UUID            NOT NULL REFERENCES events(id),
  booker_user_id        UUID            NOT NULL REFERENCES users(id),
  status                booking_status  NOT NULL DEFAULT 'pending_payment',
  payment_method        payment_method  NOT NULL DEFAULT 'free',
  hold_expires_at       timestamptz,
  total_amount_minor    BIGINT,
  total_currency        currency_code,
  created_at            timestamptz     NOT NULL DEFAULT now(),
  updated_at            timestamptz     NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_bookings_event_id ON bookings (event_id);
CREATE INDEX idx_bookings_booker_user_id ON bookings (booker_user_id);
CREATE INDEX idx_bookings_status ON bookings (status);

-- Row-Level Security
ALTER TABLE bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON bookings
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_bookings_updated ON bookings;
CREATE TRIGGER trg_bookings_updated
  BEFORE UPDATE ON bookings
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE bookings                  IS 'phase:MVP-0';
