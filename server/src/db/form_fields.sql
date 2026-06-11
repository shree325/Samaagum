-- =====================================================================
-- Samaagum  |  Table: form_fields
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS form_fields CASCADE;

CREATE TABLE form_fields (
  -- phase: MVP-0 | Individual fields within a form definition
  id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id     UUID            NOT NULL REFERENCES forms(id) ON DELETE CASCADE,
  field_type  form_field_type NOT NULL,
  label       TEXT            NOT NULL,
  required    BOOLEAN         NOT NULL DEFAULT false,
  options     JSONB,
  conditions  JSONB,
  field_scope TEXT            NOT NULL DEFAULT 'booking',
  position    INT             NOT NULL DEFAULT 0
);

COMMENT ON TABLE form_fields               IS 'phase:MVP-0';
