-- =====================================================================
-- Samaagum  |  Table: booking_line_items
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS booking_line_items CASCADE;

CREATE TABLE booking_line_items (
  -- phase: MVP-0 | A line within a booking (one ticket type or addon quantity)
  id                        UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                 UUID  NOT NULL REFERENCES tenants(id),
  booking_id                UUID  NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
  ticket_type_id            UUID  REFERENCES ticket_types(id),
  addon_id                  UUID  REFERENCES addons(id),
  quantity                  INT   NOT NULL DEFAULT 1,
  unit_price_amount_minor   BIGINT,
  unit_price_currency       currency_code,
  line_status               TEXT  NOT NULL DEFAULT 'active'
);

-- Indexes
CREATE INDEX idx_booking_line_items_booking_id ON booking_line_items (booking_id);

-- Row-Level Security
ALTER TABLE booking_line_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON booking_line_items
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE booking_line_items        IS 'phase:MVP-0';
