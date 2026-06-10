CREATE TABLE IF NOT EXISTS notification_log (
    notification_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NULL,
    user_id             UUID NOT NULL,

    channel             notification_channel_enum NOT NULL,
    template_key        TEXT NOT NULL,
    status              notification_status_enum NOT NULL DEFAULT 'queued',
    provider_refs       JSONB NOT NULL DEFAULT '{}'::jsonb,
    sent_at             TIMESTAMPTZ NULL,

    subject             TEXT NULL,
    body                TEXT NULL,
    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_notification_log_template_key_not_blank
        CHECK (btrim(template_key) <> ''),

    CONSTRAINT fk_notification_log_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notification_log_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_notification_log_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_notification_log_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_notification_log_tenant_id
    ON notification_log(tenant_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_user_id
    ON notification_log(user_id);

CREATE INDEX IF NOT EXISTS idx_notification_log_channel
    ON notification_log(channel);

CREATE INDEX IF NOT EXISTS idx_notification_log_status
    ON notification_log(status);

CREATE INDEX IF NOT EXISTS idx_notification_log_template_key
    ON notification_log(template_key);

CREATE INDEX IF NOT EXISTS idx_notification_log_sent_at
    ON notification_log(sent_at);

DROP TRIGGER IF EXISTS trg_notification_log_audit ON notification_log;
CREATE TRIGGER trg_notification_log_audit
BEFORE INSERT OR UPDATE ON notification_log
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
