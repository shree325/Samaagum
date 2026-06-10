CREATE TABLE IF NOT EXISTS form_responses (
    response_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    form_id             UUID NOT NULL,
    respondent_user_id  UUID NULL,

    context_refs        JSONB NOT NULL DEFAULT '{}'::jsonb,
    submitted_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ip_address          INET NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_form_responses_form
        FOREIGN KEY (form_id)
        REFERENCES forms(form_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_form_responses_respondent_user
        FOREIGN KEY (respondent_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_form_responses_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_form_responses_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_form_responses_form_id
    ON form_responses(form_id);

CREATE INDEX IF NOT EXISTS idx_form_responses_respondent_user_id
    ON form_responses(respondent_user_id);

CREATE INDEX IF NOT EXISTS idx_form_responses_submitted_at
    ON form_responses(submitted_at);

CREATE INDEX IF NOT EXISTS idx_form_responses_created_by_user_id
    ON form_responses(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_form_responses_updated_by_user_id
    ON form_responses(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_form_responses_audit ON form_responses;
CREATE TRIGGER trg_form_responses_audit
BEFORE INSERT OR UPDATE ON form_responses
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
