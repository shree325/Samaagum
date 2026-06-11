-- =====================================================================
-- Samaagum  |  Table: ticket_claims
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS ticket_claims CASCADE;

CREATE TABLE ticket_claims (
  -- phase: MVP-0 | One-time claim link/token for transferring a ticket to an attendee
  id          UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID        NOT NULL REFERENCES tenants(id),
  ticket_id   UUID        NOT NULL REFERENCES tickets(id) ON DELETE CASCADE,
  token       TEXT        UNIQUE NOT NULL,
  state       claim_state NOT NULL DEFAULT 'issued',
  expires_at  timestamptz,
  claimed_at  timestamptz
);

-- Indexes
CREATE INDEX idx_ticket_claims_ticket_id ON ticket_claims (ticket_id);

-- Row-Level Security
ALTER TABLE ticket_claims ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ticket_claims
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE ticket_claims             IS 'phase:MVP-0';
