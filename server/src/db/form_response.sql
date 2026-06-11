-- =====================================================================
-- Samaagum  |  Table: form_responses
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS form_responses CASCADE;

CREATE TABLE form_responses (
  -- phase: MVP-0 | A user's submission of a form
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id           UUID        NOT NULL REFERENCES tenants(id),
  form_id             UUID        NOT NULL REFERENCES forms(id),
  respondent_user_id  UUID        REFERENCES users(id),
  context_ref         UUID,
  created_at          timestamptz NOT NULL DEFAULT now()
);

-- Row-Level Security
ALTER TABLE form_responses ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON form_responses
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

COMMENT ON TABLE form_responses            IS 'phase:MVP-0';
