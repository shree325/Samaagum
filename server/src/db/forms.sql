CREATE TABLE IF NOT EXISTS forms (
    form_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    owner_entity_id     UUID NOT NULL,
    purpose             TEXT NOT NULL,
    status              form_status_enum NOT NULL DEFAULT 'draft',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_forms_purpose_not_blank
        CHECK (btrim(purpose) <> ''),

    CONSTRAINT fk_forms_owner_entity
        FOREIGN KEY (owner_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_forms_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_forms_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_forms_owner_entity_id
    ON forms(owner_entity_id);

CREATE INDEX IF NOT EXISTS idx_forms_status
    ON forms(status);

CREATE INDEX IF NOT EXISTS idx_forms_purpose
    ON forms(purpose);

CREATE INDEX IF NOT EXISTS idx_forms_created_by_user_id
    ON forms(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_forms_updated_by_user_id
    ON forms(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_forms_audit ON forms;
CREATE TRIGGER trg_forms_audit
BEFORE INSERT OR UPDATE ON forms
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
