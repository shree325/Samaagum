DROP TABLE IF EXISTS collaboration_members CASCADE;

CREATE TABLE collaboration_members (

    id                            UUID        DEFAULT gen_random_uuid() PRIMARY KEY,
    tenant_id                     UUID        NOT NULL,

    collaboration_entity_id       UUID        NOT NULL,
    user_id                       UUID        NOT NULL,

    role                          VARCHAR(50)  NOT NULL DEFAULT 'member',
    state                         VARCHAR(50)  DEFAULT 'active',

    joined_at                     TIMESTAMPTZ  DEFAULT now(),
    invited_by                    UUID,
    left_at                       TIMESTAMPTZ,

    -- System columns
    created_at                    TIMESTAMPTZ  DEFAULT now(),
    created_by                    UUID,
    updated_at                    TIMESTAMPTZ  DEFAULT now(),
    updated_by                    UUID,

    CONSTRAINT uq_collab_members_collab_user UNIQUE (collaboration_entity_id, user_id)
);

-- Row-Level Security
ALTER TABLE collaboration_members ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON collaboration_members
    USING (tenant_id = current_setting('app.current_tenant')::uuid);

CREATE INDEX idx_collab_members_tenant  ON collaboration_members (tenant_id);
CREATE INDEX idx_collab_members_collab  ON collaboration_members (collaboration_entity_id);
CREATE INDEX idx_collab_members_user    ON collaboration_members (user_id);
