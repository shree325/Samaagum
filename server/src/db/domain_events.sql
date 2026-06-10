CREATE TABLE IF NOT EXISTS domain_events (
    event_id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    event_type          TEXT NOT NULL,
    aggregate_type      TEXT NOT NULL,
    aggregate_id        UUID NOT NULL,
    payload             JSONB NOT NULL DEFAULT '{}'::jsonb,

    occurred_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    published_at        TIMESTAMPTZ NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_domain_events_event_type_not_blank
        CHECK (btrim(event_type) <> ''),

    CONSTRAINT chk_domain_events_aggregate_type_not_blank
        CHECK (btrim(aggregate_type) <> ''),

    CONSTRAINT fk_domain_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_domain_events_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_domain_events_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_domain_events_tenant_id
    ON domain_events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_domain_events_event_type
    ON domain_events(event_type);

CREATE INDEX IF NOT EXISTS idx_domain_events_aggregate
    ON domain_events(aggregate_type, aggregate_id);

CREATE INDEX IF NOT EXISTS idx_domain_events_occurred_at
    ON domain_events(occurred_at);

CREATE INDEX IF NOT EXISTS idx_domain_events_published_at
    ON domain_events(published_at);

DROP TRIGGER IF EXISTS trg_domain_events_audit ON domain_events;
CREATE TRIGGER trg_domain_events_audit
BEFORE INSERT OR UPDATE ON domain_events
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
