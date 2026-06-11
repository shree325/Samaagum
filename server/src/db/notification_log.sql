-- =====================================================================
-- Samaagum  |  Table: notification_log
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS notification_log CASCADE;

CREATE TABLE notification_log (
  -- phase: MVP-0 | Record of every notification sent (email, push, SMS)
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID        NOT NULL REFERENCES tenants(id),
  user_id         UUID        REFERENCES users(id),
  channel         TEXT        NOT NULL,
  template_key    TEXT        NOT NULL,
  status          TEXT        NOT NULL DEFAULT 'queued',
  provider_ref    TEXT,
  created_at      timestamptz NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_notification_log_user_id ON notification_log (user_id);

-- Row-Level Security
ALTER TABLE notification_log ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON notification_log
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE notification_log          IS 'phase:MVP-0';
