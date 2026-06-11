CREATE TABLE IF NOT EXISTS auth_identities (
    identity_id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id             UUID NOT NULL,
    provider            TEXT NOT NULL,
    provider_uid        TEXT NOT NULL,
    provider_email      TEXT NULL,
    password_hash       TEXT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_auth_identities_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_auth_identities_provider_not_blank
        CHECK (btrim(provider) <> ''),

    CONSTRAINT chk_auth_identities_provider_uid_not_blank
        CHECK (btrim(provider_uid) <> ''),

    CONSTRAINT uq_auth_identities_provider_uid
        UNIQUE (provider, provider_uid),

    CONSTRAINT uq_auth_identities_user_provider
        UNIQUE (user_id, provider),

    CONSTRAINT fk_auth_identities_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_auth_identities_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_auth_identities_user_id
    ON auth_identities(user_id);

CREATE INDEX IF NOT EXISTS idx_auth_identities_provider
    ON auth_identities(provider);

CREATE INDEX IF NOT EXISTS idx_auth_identities_provider_email
    ON auth_identities(provider_email);

CREATE INDEX IF NOT EXISTS idx_auth_identities_created_by_user_id
    ON auth_identities(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_auth_identities_updated_by_user_id
    ON auth_identities(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_auth_identities_audit ON auth_identities;
CREATE TRIGGER trg_auth_identities_audit
BEFORE INSERT OR UPDATE ON auth_identities
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
