CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- -----------------------------
-- ENUM TYPES
-- -----------------------------
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_type_enum') THEN
        CREATE TYPE entity_type_enum AS ENUM (
            'user',
            'org',
            'community',
            'sub_community',
            'group'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'entity_status_enum') THEN
        CREATE TYPE entity_status_enum AS ENUM (
            'active',
            'inactive',
            'draft',
            'archived',
            'deleted'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'user_state_enum') THEN
        CREATE TYPE user_state_enum AS ENUM (
            'pending',
            'active',
            'suspended',
            'deleted'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'visibility_enum') THEN
        CREATE TYPE visibility_enum AS ENUM (
            'public',
            'private',
            'restricted'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'group_subtype_enum') THEN
        CREATE TYPE group_subtype_enum AS ENUM (
            'community',
            'org',
            'group'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'join_mode_enum') THEN
        CREATE TYPE join_mode_enum AS ENUM (
            'open',
            'approval_required',
            'invite_only'
        );
    END IF;
END $$;

DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'membership_state_enum') THEN
        CREATE TYPE membership_state_enum AS ENUM (
            'pending',
            'active',
            'rejected',
            'left',
            'removed'
        );
    END IF;
END $$;

-- -----------------------------
-- HELPER FUNCTIONS
-- -----------------------------

-- Read the application user id from the session.
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

-- Role defaults trigger
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