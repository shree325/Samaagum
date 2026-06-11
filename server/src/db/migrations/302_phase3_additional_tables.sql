-- =====================================================================
-- Migration 302: Additional Tables required by Repository layers
-- Phase: MVP-2
-- =====================================================================

-- 1. Attendees
CREATE TABLE attendees (
    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    booking_id                UUID        NOT NULL REFERENCES bookings(id) ON DELETE CASCADE,
    ticket_id                 UUID        REFERENCES tickets(id) ON DELETE SET NULL,
    user_id                   UUID        REFERENCES users(id) ON DELETE SET NULL,

    name                      VARCHAR(255) NOT NULL,
    email                     VARCHAR(255),
    gender                    VARCHAR(20),
    phone                     VARCHAR(20),
    dob                       DATE,

    claimed_at                TIMESTAMPTZ,
    checkin_status            VARCHAR(50)  DEFAULT 'not_checked_in',

    notes                     TEXT,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID         REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_attendees_tenant    ON attendees (tenant_id);
CREATE INDEX idx_attendees_booking   ON attendees (booking_id);
CREATE INDEX idx_attendees_user      ON attendees (user_id);
CREATE INDEX idx_attendees_email     ON attendees (email);

-- 2. Checkin Gates
CREATE TABLE checkin_gates (
    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    event_id                  UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,

    name                      VARCHAR(255) NOT NULL,
    gate_code                 VARCHAR(50)  NOT NULL,
    gate_type                 VARCHAR(50)  DEFAULT 'entry',
    location_note             TEXT,

    device_binding_id         UUID,
    is_active                 BOOLEAN      DEFAULT TRUE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID         REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT uq_checkin_gates_tenant_code UNIQUE (tenant_id, event_id, gate_code)
);

CREATE INDEX idx_checkin_gates_tenant ON checkin_gates (tenant_id);
CREATE INDEX idx_checkin_gates_event  ON checkin_gates (event_id);

-- 3. Event Categories
CREATE TABLE event_categories (
    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id         UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    name              VARCHAR(100) NOT NULL,
    description       TEXT,
    icon_url          TEXT,

    status            VARCHAR(20)  DEFAULT 'active',
    display_order     INTEGER      DEFAULT 0,

    -- System columns
    created_at        TIMESTAMPTZ  DEFAULT now(),
    created_by        UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at        TIMESTAMPTZ  DEFAULT now(),
    updated_by        UUID         REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT uq_event_categories_tenant_name UNIQUE (tenant_id, name),
    CONSTRAINT chk_event_category_status CHECK (status IN ('active', 'inactive'))
);

CREATE INDEX idx_event_categories_tenant ON event_categories (tenant_id);

-- 4. Event Media
CREATE TABLE event_media (
    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    event_id                  UUID        NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    asset_id                  UUID        NOT NULL REFERENCES media_assets(id) ON DELETE CASCADE,

    media_type                VARCHAR(50)  NOT NULL DEFAULT 'image',
    caption                   TEXT,
    alt_text                  VARCHAR(500),

    sort_order                INTEGER      DEFAULT 0,
    visibility                VARCHAR(50)  DEFAULT 'public',
    is_primary                BOOLEAN      DEFAULT FALSE,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID         REFERENCES users(id) ON DELETE SET NULL
);

CREATE INDEX idx_event_media_tenant  ON event_media (tenant_id);
CREATE INDEX idx_event_media_event   ON event_media (event_id);

-- 5. Gamification
CREATE TABLE gamification (
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    bu_id                     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    user_id                   UUID         NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,

    points                    INTEGER      NOT NULL DEFAULT 0,
    level                     INTEGER      NOT NULL DEFAULT 1,
    badge_count               INTEGER      NOT NULL DEFAULT 0,
    x_data                    JSONB,

    -- Siebel-style System Columns
    created                   TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    last_upd                  TIMESTAMPTZ  DEFAULT now(),
    last_upd_by               UUID         REFERENCES users(id) ON DELETE SET NULL,
    modification_num          INTEGER      DEFAULT 0,
    conflict_id               VARCHAR(15)  DEFAULT '0',
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App'
);

CREATE INDEX idx_gamification_bu_id   ON gamification (bu_id);
CREATE INDEX idx_gamification_user_id ON gamification (user_id);

-- 6. ML Feature Store
CREATE TABLE ml_feature_store (
    row_id                    UUID         DEFAULT gen_random_uuid() PRIMARY KEY,
    bu_id                     UUID         NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    entity_type               VARCHAR(50)  NOT NULL, -- 'user', 'entity', 'event'
    entity_id                 UUID         NOT NULL,
    feature_name              VARCHAR(255) NOT NULL,
    feature_value             JSONB        NOT NULL,

    -- Siebel-style System Columns
    created                   TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    last_upd                  TIMESTAMPTZ  DEFAULT now(),
    last_upd_by               UUID         REFERENCES users(id) ON DELETE SET NULL,
    modification_num          INTEGER      DEFAULT 0,
    conflict_id               VARCHAR(15)  DEFAULT '0',
    db_last_upd               TIMESTAMPTZ  DEFAULT now(),
    db_last_upd_src           VARCHAR(50)  DEFAULT 'App',

    CONSTRAINT uq_ml_feature_store_entity_feature UNIQUE (entity_type, entity_id, feature_name)
);

CREATE INDEX idx_ml_feature_store_bu_id   ON ml_feature_store (bu_id);
CREATE INDEX idx_ml_feature_store_entity ON ml_feature_store (entity_type, entity_id);

-- 7. Org Domains
CREATE TABLE org_domains (
    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    org_entity_id             UUID        NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

    domain_name               VARCHAR(255) NOT NULL,
    verification_status       VARCHAR(50)  DEFAULT 'pending',
    verified_at               TIMESTAMPTZ,
    is_primary                BOOLEAN      DEFAULT FALSE,
    dns_record                JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID         REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT uq_org_domains_domain UNIQUE (domain_name)
);

CREATE INDEX idx_org_domains_tenant ON org_domains (tenant_id);
CREATE INDEX idx_org_domains_org    ON org_domains (org_entity_id);
CREATE INDEX idx_org_domains_domain ON org_domains (domain_name);

-- 8. Sub Communities
CREATE TABLE sub_communities (
    id                        UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                 UUID        NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,

    entity_id                 UUID        NOT NULL UNIQUE REFERENCES entities(id) ON DELETE CASCADE,
    community_entity_id       UUID        NOT NULL REFERENCES entities(id) ON DELETE CASCADE,

    name                      VARCHAR(255) NOT NULL,
    slug                      VARCHAR(255) NOT NULL,
    description               TEXT,
    cover_asset_id            UUID         REFERENCES media_assets(id) ON DELETE SET NULL,

    visibility                VARCHAR(50)  DEFAULT 'public',
    status                    VARCHAR(50)  DEFAULT 'active',
    member_count              INTEGER      DEFAULT 0,

    x_data                    JSONB,

    -- System columns
    created_at                TIMESTAMPTZ  DEFAULT now(),
    created_by                UUID         REFERENCES users(id) ON DELETE SET NULL,
    updated_at                TIMESTAMPTZ  DEFAULT now(),
    updated_by                UUID         REFERENCES users(id) ON DELETE SET NULL,

    CONSTRAINT uq_sub_communities_tenant_slug UNIQUE (tenant_id, slug)
);

CREATE INDEX idx_sub_communities_tenant     ON sub_communities (tenant_id);
CREATE INDEX idx_sub_communities_community  ON sub_communities (community_entity_id);

-- RLS (Row-Level Security) multi-tenancy isolation
ALTER TABLE attendees ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON attendees USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE checkin_gates ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON checkin_gates USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE event_categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_categories USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_media USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE gamification ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON gamification USING (bu_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE ml_feature_store ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON ml_feature_store USING (bu_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE org_domains ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON org_domains USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

ALTER TABLE sub_communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON sub_communities USING (tenant_id = current_setting('app.tenant_id', true)::uuid);
