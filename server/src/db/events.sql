DROP TABLE IF EXISTS events CASCADE;

CREATE TABLE events (

    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL,

    -- Ownership & hierarchy
    hosted_by_entity_id       UUID        NOT NULL,
    parent_event_id           UUID        REFERENCES events(id),
    event_category_id         UUID,
    registration_form_id      UUID,

    -- Identity
    title                     VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL,
    event_kind                VARCHAR(50)  NOT NULL DEFAULT 'standalone',
    short_description         VARCHAR(500),
    description               TEXT,

    -- Scheduling (multi-geography: all TIMESTAMPTZ, venue tz stored separately)
    starts_at                 TIMESTAMPTZ  NOT NULL,
    ends_at                   TIMESTAMPTZ  NOT NULL,
    venue_timezone            VARCHAR(100) NOT NULL DEFAULT 'UTC',

    -- Location
    location_type             VARCHAR(50)  DEFAULT 'offline',
    venue                     JSONB,
    online_link               TEXT,

    -- Media
    banner_asset_id           UUID,
    banner_url                TEXT,
    cover_asset_id            UUID,

    -- Visibility & status
    visibility                VARCHAR(50)  DEFAULT 'public',
    status                    VARCHAR(50)  DEFAULT 'draft',

    -- Capacity & registration
    capacity_total            INTEGER,
    attendee_count            INTEGER      DEFAULT 0,
    registration_mode         VARCHAR(50)  DEFAULT 'ticketed',
    approval_required         BOOLEAN      DEFAULT FALSE,

    -- Cash handling
    cash_enabled              BOOLEAN      DEFAULT FALSE,
    cash_payment_instructions TEXT,

    -- Financial lock
    financial_locked_at       TIMESTAMPTZ,

    -- Publishing & registration windows
    published_at              TIMESTAMPTZ,
    registration_open_at      TIMESTAMPTZ,
    registration_close_at     TIMESTAMPTZ,

    -- Extension / custom attributes
    x_data                    JSONB,

    -- Optimistic concurrency
    modification_num          INTEGER      DEFAULT 0,

    -- System columns (Siebel-style audit)
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID,

    CONSTRAINT uq_events_tenant_slug UNIQUE (tenant_id, slug)
);

-- Row-Level Security
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON events
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

-- Indexes
CREATE INDEX idx_events_tenant       ON events (tenant_id);
CREATE INDEX idx_events_hosted_by    ON events (hosted_by_entity_id);
CREATE INDEX idx_events_status       ON events (status);
CREATE INDEX idx_events_starts_at    ON events (starts_at);
CREATE INDEX idx_events_slug         ON events (slug);