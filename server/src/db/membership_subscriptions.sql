-- =====================================================================
-- Samaagum  |  Table: membership_subscriptions
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS membership_subscriptions CASCADE;

CREATE TABLE membership_subscriptions (
  -- phase: Phase-1.5 | User subscription to a membership tier
  id          UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id   UUID              NOT NULL REFERENCES tenants(id),
  tier_id     UUID              NOT NULL REFERENCES membership_tiers(id),
  user_id     UUID              NOT NULL REFERENCES users(id),
  state       subscription_state NOT NULL DEFAULT 'active',
  valid_from  timestamptz       NOT NULL DEFAULT now(),
  valid_to    timestamptz,
  created_at  timestamptz       NOT NULL DEFAULT now(),
  updated_at  timestamptz       NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE membership_subscriptions ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON membership_subscriptions
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_membership_subscriptions_updated ON membership_subscriptions;
CREATE TRIGGER trg_membership_subscriptions_updated
  BEFORE UPDATE ON membership_subscriptions
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE membership_subscriptions  IS 'phase:Phase-1.5';
