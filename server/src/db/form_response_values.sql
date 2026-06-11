-- =====================================================================
-- Samaagum  |  Table: form_response_values
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS form_response_values CASCADE;

CREATE TABLE form_response_values (
  -- phase: MVP-0 | Individual field values within a form response
  id          UUID  PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID  NOT NULL REFERENCES form_responses(id) ON DELETE CASCADE,
  field_id    UUID  NOT NULL REFERENCES form_fields(id),
  value       JSONB
);

COMMENT ON TABLE form_response_values      IS 'phase:MVP-0';
