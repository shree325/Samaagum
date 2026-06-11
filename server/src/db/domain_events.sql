-- =====================================================================
-- Samaagum  |  Table: domain_events
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS domain_events CASCADE;

CREATE TABLE domain_events (
  -- phase: MVP-0 | Outbox / event sourcing record for domain events
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  event_type      TEXT        NOT NULL,
  schema_version  INT         NOT NULL DEFAULT 1,
  aggregate_type  TEXT        NOT NULL,
  aggregate_id    UUID        NOT NULL,
  actor_user_id   UUID,
  correlation_id  UUID,
  causation_id    UUID,
  payload         JSONB       NOT NULL DEFAULT '{}',
  occurred_at     timestamptz NOT NULL DEFAULT now(),
  published_at    timestamptz
);

-- Indexes
CREATE INDEX idx_domain_events_aggregate_id ON domain_events (aggregate_id);
CREATE INDEX idx_domain_events_published_at ON domain_events (published_at);
CREATE INDEX idx_domain_events_tenant_id ON domain_events (tenant_id);

-- Row-Level Security
ALTER TABLE domain_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON domain_events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE domain_events             IS 'phase:MVP-0';
