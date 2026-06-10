CREATE TABLE IF NOT EXISTS form_fields (
    field_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    form_id             UUID NOT NULL,
    field_type          form_field_type_enum NOT NULL,
    label               TEXT NOT NULL,
    required            BOOLEAN NOT NULL DEFAULT FALSE,
    options             JSONB NOT NULL DEFAULT '{}'::jsonb,
    level               INTEGER NOT NULL DEFAULT 0,
    conditions          JSONB NOT NULL DEFAULT '{}'::jsonb,
    position            INTEGER NOT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_form_fields_form
        FOREIGN KEY (form_id)
        REFERENCES forms(form_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_form_fields_label_not_blank
        CHECK (btrim(label) <> ''),

    CONSTRAINT chk_form_fields_position
        CHECK (position > 0),

    CONSTRAINT chk_form_fields_level
        CHECK (level >= 0),

    CONSTRAINT fk_form_fields_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_form_fields_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_form_fields_form_position
        UNIQUE (form_id, position)
);

CREATE INDEX IF NOT EXISTS idx_form_fields_form_id
    ON form_fields(form_id);

CREATE INDEX IF NOT EXISTS idx_form_fields_field_type
    ON form_fields(field_type);

CREATE INDEX IF NOT EXISTS idx_form_fields_required
    ON form_fields(required);

CREATE INDEX IF NOT EXISTS idx_form_fields_position
    ON form_fields(position);

CREATE INDEX IF NOT EXISTS idx_form_fields_created_by_user_id
    ON form_fields(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_form_fields_updated_by_user_id
    ON form_fields(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_form_fields_audit ON form_fields;
CREATE TRIGGER trg_form_fields_audit
BEFORE INSERT OR UPDATE ON form_fields
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
