-- Needed for gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------
-- ENUM TYPES
-- -----------------------------
DO $$ BEGIN
    CREATE TYPE entity_type_enum AS ENUM (
        'user',
        'org',
        'community',
        'sub_community',
        'group'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE entity_status_enum AS ENUM (
        'active',
        'inactive',
        'archived',
        'deleted'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE visibility_enum AS ENUM (
        'public',
        'private',
        'restricted'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE group_subtype_enum AS ENUM (
        'community',
        'org',
        'group'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE join_mode_enum AS ENUM (
        'open',
        'approval_required',
        'invite_only'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE TYPE membership_state_enum AS ENUM (
        'pending',
        'active',
        'rejected',
        'left',
        'removed'
    );
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- -----------------------------
-- HELPER FUNCTIONS
-- -----------------------------

-- Read the application user id from the session.
-- Your backend can set it per request:
--   SET LOCAL app.user_id = 'uuid-here';
CREATE OR REPLACE FUNCTION fn_current_app_user_id()
RETURNS UUID
LANGUAGE plpgsql
STABLE
AS $$
DECLARE
    v_user_id_text TEXT;
BEGIN
    v_user_id_text := current_setting('app.user_id', true);

    IF v_user_id_text IS NULL OR btrim(v_user_id_text) = '' THEN
        RETURN NULL;
    END IF;

    RETURN v_user_id_text::uuid;
EXCEPTION
    WHEN invalid_text_representation THEN
        RETURN NULL;
END;
$$;

-- Generic audit trigger for tables that have:
-- created_by_user_id, updated_by_user_id, modification_num, created_at, updated_at
CREATE OR REPLACE FUNCTION fn_set_audit_fields()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_user_id UUID := fn_current_app_user_id();
BEGIN
    IF TG_OP = 'INSERT' THEN
        NEW.created_at := COALESCE(NEW.created_at, NOW());
        NEW.updated_at := COALESCE(NEW.updated_at, NOW());
        NEW.modification_num := COALESCE(NEW.modification_num, 1);

        NEW.created_by_user_id := COALESCE(NEW.created_by_user_id, v_user_id);
        NEW.updated_by_user_id := COALESCE(NEW.updated_by_user_id, v_user_id);

        RETURN NEW;
    END IF;

    IF TG_OP = 'UPDATE' THEN
        NEW.updated_at := NOW();
        NEW.modification_num := COALESCE(OLD.modification_num, 0) + 1;

        NEW.created_at := COALESCE(NEW.created_at, OLD.created_at);
        NEW.created_by_user_id := COALESCE(NEW.created_by_user_id, OLD.created_by_user_id);
        NEW.updated_by_user_id := COALESCE(v_user_id, NEW.updated_by_user_id, OLD.updated_by_user_id);

        RETURN NEW;
    END IF;

    RETURN NEW;
END;
$$;

-- Role defaults:
-- If key is omitted, it is generated from name.
-- If level is omitted, a default is assigned from name.
-- User can still explicitly pass level to override it.
CREATE OR REPLACE FUNCTION fn_roles_before_write()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_name TEXT;
BEGIN
    IF NEW.name IS NULL OR btrim(NEW.name) = '' THEN
        RAISE EXCEPTION 'roles.name cannot be empty';
    END IF;

    v_name := lower(btrim(NEW.name));

    IF NEW.key IS NULL OR btrim(NEW.key) = '' THEN
        NEW.key := regexp_replace(v_name, '[^a-z0-9]+', '_', 'g');
        NEW.key := regexp_replace(NEW.key, '^_+|_+$', '', 'g');
    END IF;

    IF NEW.level IS NULL THEN
        NEW.level := CASE v_name
            WHEN 'super admin' THEN 100
            WHEN 'organization admin' THEN 80
            WHEN 'community admin' THEN 70
            WHEN 'sub community admin' THEN 65
            WHEN 'group admin' THEN 60
            WHEN 'moderator' THEN 40
            WHEN 'member' THEN 10
            WHEN 'guest' THEN 0
            ELSE 0
        END;
    END IF;

    RETURN NEW;
END;
$$;

-- Validate that a row in a subtype table points to the correct entity type.
CREATE OR REPLACE FUNCTION fn_assert_entity_type()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    expected_type TEXT := TG_ARGV[0];
    actual_type TEXT;
BEGIN
    SELECT e.entity_type::text
      INTO actual_type
      FROM entities e
     WHERE e.entity_id = NEW.entity_id;

    IF actual_type IS NULL THEN
        RAISE EXCEPTION 'Entity % does not exist', NEW.entity_id;
    END IF;

    IF actual_type <> expected_type THEN
        RAISE EXCEPTION 'Entity % is %, expected %', NEW.entity_id, actual_type, expected_type;
    END IF;

    RETURN NEW;
END;
$$;

-- Validate hierarchy for entities.
-- Rule used here:
--   community      -> parent may be NULL or org
--   sub_community  -> parent should be a community when provided / on insert
--   group          -> parent may be NULL or org/community/sub_community
CREATE OR REPLACE FUNCTION fn_validate_entity_hierarchy()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_parent_type TEXT;
BEGIN
    IF NEW.parent_entity_id IS NOT NULL THEN
        SELECT e.entity_type::text
          INTO v_parent_type
          FROM entities e
         WHERE e.entity_id = NEW.parent_entity_id;

        IF v_parent_type IS NULL THEN
            RAISE EXCEPTION 'Parent entity % does not exist', NEW.parent_entity_id;
        END IF;
    END IF;

    IF NEW.entity_type = 'community' THEN
        IF NEW.parent_entity_id IS NOT NULL AND v_parent_type <> 'org' THEN
            RAISE EXCEPTION 'Community parent must be an org entity';
        END IF;

    ELSIF NEW.entity_type = 'sub_community' THEN
        IF TG_OP = 'INSERT' AND NEW.parent_entity_id IS NULL THEN
            RAISE EXCEPTION 'Sub community must have a parent community';
        END IF;

        IF NEW.parent_entity_id IS NOT NULL AND v_parent_type <> 'community' THEN
            RAISE EXCEPTION 'Sub community parent must be a community entity';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

-- -----------------------------
-- 1) ENTITY REGISTRY (SUPERTYPE)
-- -----------------------------
CREATE TABLE IF NOT EXISTS entities (
    entity_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    parent_entity_id    UUID NULL,

    entity_type         entity_type_enum NOT NULL,

    name                VARCHAR(150) NOT NULL,
    slug                TEXT NOT NULL,
    description         TEXT NULL,

    status              entity_status_enum NOT NULL DEFAULT 'active',
    visibility          visibility_enum NOT NULL DEFAULT 'private',

    metadata            JSONB NOT NULL DEFAULT '{}'::jsonb,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_entities_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT chk_entities_slug_not_blank
        CHECK (btrim(slug) <> ''),

    CONSTRAINT fk_entities_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_entities_parent
        FOREIGN KEY (parent_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_entities_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_entities_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_entities_tenant_slug
        UNIQUE (tenant_id, slug)
);

CREATE INDEX IF NOT EXISTS idx_entities_tenant_id
    ON entities(tenant_id);

CREATE INDEX IF NOT EXISTS idx_entities_parent_entity_id
    ON entities(parent_entity_id);

CREATE INDEX IF NOT EXISTS idx_entities_entity_type
    ON entities(entity_type);

CREATE INDEX IF NOT EXISTS idx_entities_status
    ON entities(status);

CREATE INDEX IF NOT EXISTS idx_entities_slug
    ON entities(slug);

CREATE INDEX IF NOT EXISTS idx_entities_created_by_user_id
    ON entities(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_entities_updated_by_user_id
    ON entities(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_entities_audit ON entities;
CREATE TRIGGER trg_entities_audit
BEFORE INSERT OR UPDATE ON entities
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

DROP TRIGGER IF EXISTS trg_entities_hierarchy ON entities;
CREATE TRIGGER trg_entities_hierarchy
BEFORE INSERT OR UPDATE ON entities
FOR EACH ROW
EXECUTE FUNCTION fn_validate_entity_hierarchy();

-- -----------------------------
-- 2) ROLES CATALOG
-- -----------------------------
CREATE TABLE IF NOT EXISTS roles (
    role_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    key                 TEXT NOT NULL UNIQUE,
    name                TEXT NOT NULL UNIQUE,
    level               INTEGER NOT NULL DEFAULT 0,
    phase               TEXT NULL,
    is_reserved         BOOLEAN NOT NULL DEFAULT FALSE,
    description         TEXT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_roles_key_not_blank
        CHECK (btrim(key) <> ''),

    CONSTRAINT chk_roles_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT chk_roles_level
        CHECK (level >= 0),

    CONSTRAINT fk_roles_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_roles_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

DROP TRIGGER IF EXISTS trg_roles_before_write ON roles;
CREATE TRIGGER trg_roles_before_write
BEFORE INSERT ON roles
FOR EACH ROW
EXECUTE FUNCTION fn_roles_before_write();

DROP TRIGGER IF EXISTS trg_roles_audit ON roles;
CREATE TRIGGER trg_roles_audit
BEFORE INSERT OR UPDATE ON roles
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

-- -----------------------------
-- 3) COMMUNITIES (SUBTYPE)
-- -----------------------------
CREATE TABLE IF NOT EXISTS communities (
    entity_id UUID PRIMARY KEY,

    CONSTRAINT fk_communities_entity
        FOREIGN KEY (entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trg_communities_entity_type ON communities;
CREATE TRIGGER trg_communities_entity_type
BEFORE INSERT OR UPDATE ON communities
FOR EACH ROW
EXECUTE FUNCTION fn_assert_entity_type('community');

-- -----------------------------
-- 4) SUB COMMUNITIES (SUBTYPE)
-- -----------------------------
CREATE TABLE IF NOT EXISTS sub_communities (
    entity_id UUID PRIMARY KEY,

    CONSTRAINT fk_sub_communities_entity
        FOREIGN KEY (entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE
);

DROP TRIGGER IF EXISTS trg_sub_communities_entity_type ON sub_communities;
CREATE TRIGGER trg_sub_communities_entity_type
BEFORE INSERT OR UPDATE ON sub_communities
FOR EACH ROW
EXECUTE FUNCTION fn_assert_entity_type('sub_community');

-- -----------------------------
-- 5) GROUPS (SUBTYPE)
-- -----------------------------
CREATE TABLE IF NOT EXISTS groups (
    entity_id       UUID PRIMARY KEY,

    join_mode       join_mode_enum NOT NULL DEFAULT 'approval_required',
    join_form_id    UUID NULL,
    listed          BOOLEAN NOT NULL DEFAULT TRUE,
    subtype         group_subtype_enum NOT NULL DEFAULT 'community',

    CONSTRAINT fk_groups_entity
        FOREIGN KEY (entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_groups_join_form
        FOREIGN KEY (join_form_id)
        REFERENCES forms(form_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_groups_join_mode
    ON groups(join_mode);

CREATE INDEX IF NOT EXISTS idx_groups_listed
    ON groups(listed);

CREATE INDEX IF NOT EXISTS idx_groups_subtype
    ON groups(subtype);

DROP TRIGGER IF EXISTS trg_groups_entity_type ON groups;
CREATE TRIGGER trg_groups_entity_type
BEFORE INSERT OR UPDATE ON groups
FOR EACH ROW
EXECUTE FUNCTION fn_assert_entity_type('group');

-- -----------------------------
-- 6) ROLE ASSIGNMENTS (RBAC)
-- -----------------------------
CREATE TABLE IF NOT EXISTS role_assignments (
    id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id             UUID NOT NULL,
    role_id             UUID NOT NULL,
    scope_entity_id     UUID NOT NULL,
    granted_by_user_id  UUID NULL,

    assigned_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at          TIMESTAMPTZ NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_role_assignments_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_role
        FOREIGN KEY (role_id)
        REFERENCES roles(role_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_scope_entity
        FOREIGN KEY (scope_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_role_assignments_granted_by
        FOREIGN KEY (granted_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_role_assignments
        UNIQUE (user_id, role_id, scope_entity_id),

    CONSTRAINT chk_role_assignments_expires_at
        CHECK (expires_at IS NULL OR expires_at >= assigned_at),

    CONSTRAINT fk_role_assignments_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_role_assignments_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_role_assignments_user_id
    ON role_assignments(user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_role_id
    ON role_assignments(role_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_scope_entity_id
    ON role_assignments(scope_entity_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_granted_by_user_id
    ON role_assignments(granted_by_user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_created_by_user_id
    ON role_assignments(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_role_assignments_updated_by_user_id
    ON role_assignments(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_role_assignments_audit ON role_assignments;
CREATE TRIGGER trg_role_assignments_audit
BEFORE INSERT OR UPDATE ON role_assignments
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

-- -----------------------------
-- 7) GROUP MEMBERSHIPS
-- -----------------------------
CREATE TABLE IF NOT EXISTS group_memberships (
    id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    group_id             UUID NOT NULL,
    user_id              UUID NOT NULL,

    state                membership_state_enum NOT NULL DEFAULT 'pending',
    joined_at            TIMESTAMPTZ NULL,

    form_response_id     UUID NULL,
    invited_by_user_id   UUID NULL,
    accepted_by_user_id  UUID NULL,
    responded_at         TIMESTAMPTZ NULL,

    membership_end_at    TIMESTAMPTZ NULL,

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_group_memberships_group
        FOREIGN KEY (group_id)
        REFERENCES groups(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_memberships_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_group_memberships_invited_by
        FOREIGN KEY (invited_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_accepted_by
        FOREIGN KEY (accepted_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_form_response
        FOREIGN KEY (form_response_id)
        REFERENCES form_responses(response_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_group_memberships
        UNIQUE (group_id, user_id),

    CONSTRAINT chk_group_memberships_membership_end_at
        CHECK (membership_end_at IS NULL OR joined_at IS NULL OR membership_end_at >= joined_at),

    CONSTRAINT fk_group_memberships_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_group_memberships_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_group_memberships_group_id
    ON group_memberships(group_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_user_id
    ON group_memberships(user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_state
    ON group_memberships(state);

CREATE INDEX IF NOT EXISTS idx_group_memberships_invited_by_user_id
    ON group_memberships(invited_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_accepted_by_user_id
    ON group_memberships(accepted_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_created_by_user_id
    ON group_memberships(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_group_memberships_updated_by_user_id
    ON group_memberships(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_group_memberships_audit ON group_memberships;
CREATE TRIGGER trg_group_memberships_audit
BEFORE INSERT OR UPDATE ON group_memberships
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();

-- -----------------------------
-- 8) OPTIONAL ROLE SEED DATA
-- -----------------------------
INSERT INTO roles (key, name, level, phase, is_reserved, description)
VALUES
('super_admin',      'Super Admin',         100, NULL, true, 'System-wide super administrator'),
('org_admin',        'Organization Admin',    80, NULL, true, 'Administrator for an organization'),
('community_admin',  'Community Admin',       70, NULL, true, 'Administrator for a community'),
('group_admin',      'Group Admin',           60, NULL, true, 'Administrator for a group'),
('moderator',        'Moderator',             40, NULL, true, 'Moderator for a community or group'),
('member',           'Member',                10, NULL, true, 'Standard member')
ON CONFLICT (key) DO UPDATE
SET
    name = EXCLUDED.name,
    level = EXCLUDED.level,
    phase = EXCLUDED.phase,
    is_reserved = EXCLUDED.is_reserved,
    description = EXCLUDED.description,
    updated_at = NOW(),
    modification_num = roles.modification_num + 1;