-- =====================================================================
-- Samaagum  |  Table: event_team_assignments
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS event_team_assignments CASCADE;

CREATE TABLE event_team_assignments (
  -- phase: MVP-0 | Staff/volunteer assignments to events with a scoped role
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID              NOT NULL REFERENCES tenants(id),
  event_id    UUID              NOT NULL REFERENCES events(id) ON DELETE CASCADE,
  user_id     UUID              NOT NULL REFERENCES users(id),
  role_id     UUID              NOT NULL REFERENCES roles(id),
  state       assignment_state  NOT NULL DEFAULT 'active',
  granted_by  UUID              REFERENCES users(id),
  expires_at  timestamptz,
  UNIQUE (event_id, user_id, role_id),
  created_at  timestamptz       NOT NULL DEFAULT now(),
  updated_at  timestamptz       NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE event_team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_team_assignments
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_event_team_assignments_updated ON event_team_assignments;
CREATE TRIGGER trg_event_team_assignments_updated
  BEFORE UPDATE ON event_team_assignments
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE event_team_assignments    IS 'phase:MVP-0';
