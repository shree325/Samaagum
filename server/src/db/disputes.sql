-- =====================================================================
-- Samaagum  |  Table: disputes
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS disputes CASCADE;

CREATE TABLE disputes (
  -- phase: MVP-0 | Financial or operational dispute linked to a support case
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  support_case_id UUID        REFERENCES support_cases(id),
  booking_id      UUID        REFERENCES bookings(id),
  payment_id      UUID        REFERENCES payments(id),
  state           TEXT        NOT NULL DEFAULT 'open',
  outcome         TEXT,
  handled_by      UUID        REFERENCES users(id),
  resolved_at     timestamptz,
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON disputes
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_disputes_updated ON disputes;
CREATE TRIGGER trg_disputes_updated
  BEFORE UPDATE ON disputes
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE disputes                  IS 'phase:MVP-0';
