DROP TABLE IF EXISTS event_team_assignments CASCADE;

CREATE TABLE event_team_assignments (

    id                UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id         UUID        NOT NULL,

    event_id          UUID        NOT NULL,
    user_id           UUID        NOT NULL,
    role_id           UUID        NOT NULL,
    granted_by        UUID,

    assigned_at       TIMESTAMPTZ  DEFAULT now(),
    expires_at        TIMESTAMPTZ,
    revoked_at        TIMESTAMPTZ,

    status            VARCHAR(50)  DEFAULT 'active',
    notes             TEXT,

    -- System columns
    created_at        TIMESTAMPTZ  DEFAULT now(),
    created_by        UUID,
    updated_at        TIMESTAMPTZ  DEFAULT now(),
    updated_by        UUID,

    CONSTRAINT uq_event_team_event_user_role UNIQUE (event_id, user_id, role_id)
);

-- Row-Level Security
ALTER TABLE event_team_assignments ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON event_team_assignments
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_event_team_tenant   ON event_team_assignments (tenant_id);
CREATE INDEX idx_event_team_event    ON event_team_assignments (event_id);
CREATE INDEX idx_event_team_user     ON event_team_assignments (user_id);