CREATE TABLE IF NOT EXISTS events (
    event_id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id               UUID NOT NULL,
    hosted_by_entity_id     UUID NOT NULL,
    parent_event_id         UUID NULL,
    registration_form_id    UUID NULL,

    -- Identity
    title                   VARCHAR(255) NOT NULL,
    slug                    VARCHAR(255) NOT NULL,
    event_kind              VARCHAR(50) NOT NULL DEFAULT 'standalone',
    short_description       VARCHAR(500) NULL,
    description             TEXT NULL,

    -- Scheduling
    starts_at               TIMESTAMPTZ NOT NULL,
    ends_at                 TIMESTAMPTZ NOT NULL,
    venue_timezone          VARCHAR(100) NOT NULL DEFAULT 'UTC',

    -- Location
    location_type           VARCHAR(50) NULL DEFAULT 'offline',
    venue                   JSONB NULL,
    online_link             TEXT NULL,

    -- Media
    cover_asset_id          UUID NULL,
    banner_asset_id         UUID NULL,

    -- Visibility & status
    visibility              visibility_enum NOT NULL DEFAULT 'private',
    status                  event_status_enum NOT NULL DEFAULT 'draft',

    -- Capacity & registration
    capacity_total          INTEGER NULL,
    attendee_count          INTEGER NOT NULL DEFAULT 0,
    registration_mode       VARCHAR(50) NOT NULL DEFAULT 'ticketed',
    approval_required       BOOLEAN NOT NULL DEFAULT FALSE,

    -- Publishing windows
    published_at            TIMESTAMPTZ NULL,
    registration_open_at    TIMESTAMPTZ NULL,
    registration_close_at   TIMESTAMPTZ NULL,

    -- Extension
    metadata                JSONB NOT NULL DEFAULT '{}'::jsonb,

    -- Audit
    created_by_user_id      UUID NULL,
    updated_by_user_id      UUID NULL,
    modification_num        INTEGER NOT NULL DEFAULT 1,

    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_events_title_not_blank
        CHECK (btrim(title) <> ''),

    CONSTRAINT chk_events_slug_not_blank
        CHECK (btrim(slug) <> ''),

    CONSTRAINT chk_events_dates
        CHECK (ends_at >= starts_at),

    CONSTRAINT chk_events_capacity
        CHECK (capacity_total IS NULL OR capacity_total > 0),

    CONSTRAINT fk_events_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_events_hosted_by_entity
        FOREIGN KEY (hosted_by_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_events_parent_event
        FOREIGN KEY (parent_event_id)
        REFERENCES events(event_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_registration_form
        FOREIGN KEY (registration_form_id)
        REFERENCES forms(form_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_cover_asset
        FOREIGN KEY (cover_asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_banner_asset
        FOREIGN KEY (banner_asset_id)
        REFERENCES media_assets(asset_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_events_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_events_tenant_slug
        UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_events_tenant_id
    ON events(tenant_id);

CREATE INDEX IF NOT EXISTS idx_events_hosted_by_entity_id
    ON events(hosted_by_entity_id);

CREATE INDEX IF NOT EXISTS idx_events_parent_event_id
    ON events(parent_event_id);

CREATE INDEX IF NOT EXISTS idx_events_status
    ON events(status);

CREATE INDEX IF NOT EXISTS idx_events_visibility
    ON events(visibility);

CREATE INDEX IF NOT EXISTS idx_events_starts_at
    ON events(starts_at);

CREATE INDEX IF NOT EXISTS idx_events_ends_at
    ON events(ends_at);

CREATE INDEX IF NOT EXISTS idx_events_slug
    ON events(slug);

CREATE INDEX IF NOT EXISTS idx_events_created_by_user_id
    ON events(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_events_updated_by_user_id
    ON events(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_events_audit ON events;
CREATE TRIGGER trg_events_audit
BEFORE INSERT OR UPDATE ON events
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();