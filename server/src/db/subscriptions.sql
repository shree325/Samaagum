-- =====================================================================
-- Samaagum  |  Table: subscriptions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS subscriptions CASCADE;

CREATE TABLE subscriptions (
  -- phase: MVP-0 | Active subscription linking an entity to a plan
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID              NOT NULL REFERENCES tenants(id),
  plan_id         UUID              NOT NULL REFERENCES plans(id),
  owner_entity_id UUID              NOT NULL REFERENCES entities(id),
  state           subscription_state NOT NULL DEFAULT 'active',
  valid_from      timestamptz       NOT NULL DEFAULT now(),
  valid_to        timestamptz,
  grace_until     timestamptz,
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_subscriptions_owner_entity_id ON subscriptions (owner_entity_id);

-- Row-Level Security
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON subscriptions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_subscriptions_updated ON subscriptions;
CREATE TRIGGER trg_subscriptions_updated
  BEFORE UPDATE ON subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE subscriptions             IS 'phase:MVP-0';
