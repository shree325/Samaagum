-- =====================================================================
-- Samaagum  |  Table: ticket_types
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ticket_types CASCADE;

CREATE TABLE ticket_types (
  -- phase: MVP-0 | Ticket category/tier for an event (general, VIP, etc.)
  id                          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id                   UUID              NOT NULL REFERENCES tenants(id),
  event_id                    UUID              NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  name                        TEXT              NOT NULL,
  description                 TEXT,
  price_amount_minor          BIGINT,
  price_currency              currency_code,
  capacity                    INT,
  max_per_booking             INT,
  sale_start                  timestamptz,
  sale_end                    timestamptz,
  early_bird_price_amount_minor BIGINT,
  early_bird_price_currency   currency_code,
  early_bird_ends_at          timestamptz,
  visibility                  ticket_visibility NOT NULL DEFAULT 'public',
  eligibility                 JSONB,
  created_at                  timestamptz       NOT NULL DEFAULT now(),
  updated_at                  timestamptz       NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ticket_types_event_id ON ticket_types (event_id);

-- Row-Level Security
ALTER TABLE ticket_types ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_types
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_ticket_types_updated ON ticket_types;
CREATE TRIGGER trg_ticket_types_updated
  BEFORE UPDATE ON ticket_types
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE ticket_types              IS 'phase:MVP-0';
