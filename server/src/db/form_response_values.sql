CREATE TABLE IF NOT EXISTS form_response_values (
    value_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    response_id         UUID NOT NULL,
    field_id            UUID NOT NULL,
    value               JSONB NOT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_form_response_values_response
        FOREIGN KEY (response_id)
        REFERENCES form_responses(response_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_form_response_values_field
        FOREIGN KEY (field_id)
        REFERENCES form_fields(field_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_form_response_values_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_form_response_values_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_form_response_values
        UNIQUE (response_id, field_id)
);

CREATE INDEX IF NOT EXISTS idx_form_response_values_response_id
    ON form_response_values(response_id);

CREATE INDEX IF NOT EXISTS idx_form_response_values_field_id
    ON form_response_values(field_id);

CREATE INDEX IF NOT EXISTS idx_form_response_values_created_by_user_id
    ON form_response_values(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_form_response_values_updated_by_user_id
    ON form_response_values(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_form_response_values_audit ON form_response_values;
CREATE TRIGGER trg_form_response_values_audit
BEFORE INSERT OR UPDATE ON form_response_values
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();