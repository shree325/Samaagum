-- =====================================================================
-- Samaagum  |  Table: forms
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS forms CASCADE;

CREATE TABLE forms (
  -- phase: MVP-0 | Reusable dynamic forms (event registration, group join, etc.)
  id              UUID          PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID          NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID          NOT NULL REFERENCES entities(id),
  purpose         form_purpose  NOT NULL,
  status          TEXT          NOT NULL DEFAULT 'active',
  created_at      timestamptz   NOT NULL DEFAULT now(),
  updated_at      timestamptz   NOT NULL DEFAULT now()
);


-- Deferred: enforce FKs that reference forms/form_responses (created after groups/group_memberships)
ALTER TABLE groups            ADD CONSTRAINT fk_groups_join_form   FOREIGN KEY (join_form_id)     REFERENCES forms(id)         ON DELETE SET NULL;
ALTER TABLE group_memberships ADD CONSTRAINT fk_gm_form_response   FOREIGN KEY (form_response_id) REFERENCES form_responses(id) ON DELETE SET NULL;

-- Row-Level Security
ALTER TABLE forms ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON forms
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_forms_updated ON forms;
CREATE TRIGGER trg_forms_updated
  BEFORE UPDATE ON forms
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE forms                     IS 'phase:MVP-0';
