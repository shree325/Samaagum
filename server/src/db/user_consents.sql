CREATE TABLE IF NOT EXISTS user_consents (
    consent_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id             UUID NOT NULL,
    consent_type        consent_type_enum NOT NULL,
    version             TEXT NOT NULL,
    granted_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    revoked_at          TIMESTAMPTZ NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_user_consents_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_user_consents_version_not_blank
        CHECK (btrim(version) <> ''),

    CONSTRAINT uq_user_consents
        UNIQUE (user_id, consent_type, version),

    CONSTRAINT fk_user_consents_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_user_consents_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_user_consents_user_id
    ON user_consents(user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_consent_type
    ON user_consents(consent_type);

CREATE INDEX IF NOT EXISTS idx_user_consents_granted_at
    ON user_consents(granted_at);

CREATE INDEX IF NOT EXISTS idx_user_consents_created_by_user_id
    ON user_consents(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_user_consents_updated_by_user_id
    ON user_consents(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_user_consents_audit ON user_consents;
CREATE TRIGGER trg_user_consents_audit
BEFORE INSERT OR UPDATE ON user_consents
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
