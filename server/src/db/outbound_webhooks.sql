-- =====================================================================
-- Samaagum  |  Table: outbound_webhooks
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS outbound_webhooks CASCADE;

CREATE TABLE outbound_webhooks (
  -- phase: Phase-2 | Webhook endpoint registered by an api_client
  id          UUID    PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id   UUID    NOT NULL REFERENCES api_clients(id) ON DELETE CASCADE,
  url         TEXT    NOT NULL,
  event_types JSONB,
  secret      TEXT,
  active      BOOLEAN NOT NULL DEFAULT true
);

COMMENT ON TABLE outbound_webhooks         IS 'phase:Phase-2';
