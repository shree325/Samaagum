-- =====================================================================
-- Samaagum  |  Table: events
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (
  -- phase: MVP-0 | Core event record (standalone / parent series / session)
  id                      UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id               UUID              NOT NULL REFERENCES tenants(id),
  hosted_by_entity_id     UUID              NOT NULL REFERENCES entities(id),
  parent_event_id         UUID              REFERENCES events(id),
  event_kind              event_kind        NOT NULL DEFAULT 'standalone',
  title                   TEXT              NOT NULL,
  description             TEXT,
  status                  event_status      NOT NULL DEFAULT 'draft',
  starts_at               timestamptz,
  ends_at                 timestamptz,
  -- venue_timezone: IANA timezone string (e.g. 'Asia/Kolkata') for display purposes
  venue_timezone          TEXT,
  location_type           location_type     NOT NULL DEFAULT 'venue',
  venue                   JSONB,
  online_link             TEXT,
  capacity_total          INT,
  registration_mode       registration_mode NOT NULL DEFAULT 'paid',
  approval_required       BOOLEAN           NOT NULL DEFAULT false,
  registration_form_id    UUID              REFERENCES forms(id),
  cash_enabled            BOOLEAN           NOT NULL DEFAULT false,
  financial_locked_at     timestamptz,
  instruction             TEXT,
  created_at              timestamptz       NOT NULL DEFAULT now(),
  updated_at              timestamptz       NOT NULL DEFAULT now()
);


-- Deferred: enforce collaborations.primary_event_id (events created after collaborations)
ALTER TABLE collaborations ADD CONSTRAINT fk_collab_primary_event FOREIGN KEY (primary_event_id) REFERENCES events(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_events_tenant_id ON events (tenant_id);
CREATE INDEX idx_events_hosted_by_entity_id ON events (hosted_by_entity_id);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_events_starts_at ON events (starts_at);

-- Row-Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON events
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_events_updated ON events;
CREATE TRIGGER trg_events_updated
  BEFORE UPDATE ON events
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE events                    IS 'phase:MVP-0';
