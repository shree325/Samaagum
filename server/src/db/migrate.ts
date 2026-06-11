import { Client } from 'pg';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// Use override: true to ensure values from .env override any system/shell env variables (like DB_PORT)
dotenv.config({ path: path.join(__dirname, '../../.env'), override: true });

const dbHost = process.env.DB_HOST || 'localhost';
const dbPort = parseInt(process.env.DB_PORT || '5432', 10);
const dbUser = process.env.DB_USER || 'postgres';
const dbPassword = process.env.DB_PASSWORD || '';
const dbName = process.env.DB_NAME || 'samaagum';

async function migrate() {
  console.log(`🚀 Starting Samaagum database migrations on host: ${dbHost}, port: ${dbPort}...`);

  // Step 1: Connect to default 'postgres' database to check/create target database
  const initClient = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: 'postgres',
  });

  try {
    await initClient.connect();
    const res = await initClient.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName]);
    if (res.rowCount === 0) {
      console.log(`Database "${dbName}" does not exist. Creating it...`);
      await initClient.query(`CREATE DATABASE "${dbName}"`);
      console.log(`Database "${dbName}" created successfully.`);
    } else {
      console.log(`Database "${dbName}" already exists.`);
    }
  } catch (err: any) {
    console.error('❌ Error checking/creating database:', err.message);
    process.exit(1);
  } finally {
    await initClient.end();
  }

  // Step 2: Connect to target database
  const client = new Client({
    host: dbHost,
    port: dbPort,
    user: dbUser,
    password: dbPassword,
    database: dbName,
  });

  try {
    await client.connect();
    console.log(`Connected to database "${dbName}".`);

    // Clean start: Drop and recreate public schema to avoid collision on re-run
    console.log('Resetting database schema...');
    await client.query('DROP SCHEMA public CASCADE; CREATE SCHEMA public;');
    console.log('✅ Database schema reset.');

    // Ensure all required ENUM types exist before running any DDL
    const enums = [
      { name: 'entity_type_enum', values: ['user', 'org', 'community', 'sub_community', 'group'] },
      { name: 'entity_status_enum', values: ['active', 'inactive', 'archived', 'deleted'] },
      { name: 'visibility_enum', values: ['public', 'private', 'restricted'] },
      { name: 'group_subtype_enum', values: ['community', 'org', 'group'] },
      { name: 'join_mode_enum', values: ['open', 'approval_required', 'invite_only'] },
      { name: 'membership_state_enum', values: ['pending', 'active', 'rejected', 'left', 'removed'] },
      { name: 'user_state_enum', values: ['pending', 'active', 'suspended', 'deleted'] },
      { name: 'plan_status_enum', values: ['draft', 'active', 'archived', 'deleted'] },
      { name: 'subscription_state_enum', values: ['pending', 'active', 'trialing', 'past_due', 'canceled', 'unpaid'] },
      { name: 'connection_state_enum', values: ['pending', 'accepted', 'ignored', 'blocked'] },
      { name: 'event_status_enum', values: ['draft', 'published', 'cancelled', 'completed'] },
      { name: 'notification_channel_enum', values: ['email', 'sms', 'push', 'in_app'] },
      { name: 'notification_status_enum', values: ['queued', 'sent', 'failed', 'retry'] },
      { name: 'form_status_enum', values: ['draft', 'active', 'archived'] },
      { name: 'form_field_type_enum', values: ['text', 'textarea', 'number', 'select', 'checkbox', 'radio', 'file', 'date'] },
      { name: 'profile_requirement_status_enum', values: ['pending', 'completed', 'exempt'] },
      { name: 'profile_link_kind_enum', values: ['github', 'linkedin', 'twitter', 'website', 'other'] },
      { name: 'profile_link_visibility_enum', values: ['public', 'private', 'restricted'] },
      { name: 'consent_type_enum', values: ['terms_of_service', 'privacy_policy', 'marketing'] },
      { name: 'profile_requirement_audience_enum', values: ['all', 'members', 'guests'] },
      { name: 'entity_visibility_scope_enum', values: ['tenant', 'global'] },
      { name: 'forum_scope_type_enum', values: ['global', 'tenant', 'entity'] },
      { name: 'forum_post_status_enum', values: ['draft', 'published', 'hidden', 'deleted'] },
      { name: 'forum_comment_status_enum', values: ['visible', 'hidden', 'deleted'] },
      { name: 'category_status_enum', values: ['active', 'inactive'] },
      { name: 'audit_action_enum', values: ['create', 'update', 'delete', 'login', 'logout', 'other'] },
      { name: 'conversation_type_enum', values: ['direct', 'group', 'event'] },
      { name: 'conversation_status_enum', values: ['active', 'archived', 'deleted'] },
      { name: 'conversation_participant_role_enum', values: ['owner', 'admin', 'moderator', 'member'] },
    ];

    console.log('Ensuring all ENUM types exist...');
    for (const e of enums) {
      const vals = e.values.map(v => `'${v}'`).join(', ');
      const sql = `
        DO $$ BEGIN
          CREATE TYPE ${e.name} AS ENUM (${vals});
        EXCEPTION
          WHEN duplicate_object THEN NULL;
        END $$;
      `;
      await client.query(sql);
    }
    console.log('✅ All ENUM types verified/created.');

    // Pre-create standard helper functions so tables can reference them in triggers
    console.log('Ensuring all helper functions exist...');
    const functionsSql = `
      -- Needed for gen_random_uuid()
      CREATE EXTENSION IF NOT EXISTS pgcrypto;

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

      -- Role defaults:
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

      -- Validate forum post scopes
      CREATE OR REPLACE FUNCTION fn_validate_forum_scope()
      RETURNS TRIGGER
      LANGUAGE plpgsql
      AS $$
      BEGIN
          IF NEW.scope_type = 'global' THEN
              IF NEW.scope_id IS NOT NULL THEN
                  RAISE EXCEPTION 'Global scope must not have a scope_id';
              END IF;
          ELSIF NEW.scope_type = 'tenant' THEN
              IF NOT EXISTS (SELECT 1 FROM tenants WHERE tenant_id = NEW.scope_id) THEN
                  RAISE EXCEPTION 'Tenant % does not exist', NEW.scope_id;
              END IF;
          ELSIF NEW.scope_type = 'entity' THEN
              IF NOT EXISTS (SELECT 1 FROM entities WHERE entity_id = NEW.scope_id) THEN
                  RAISE EXCEPTION 'Entity % does not exist', NEW.scope_id;
              END IF;
          END IF;
          RETURN NEW;
      END;
      $$;
    `;
    await client.query(functionsSql);
    console.log('✅ All helper functions created.');

    // Step 3: Pre-create tenants, entities, and users tables without circular FKs
    console.log('Pre-creating core tables (tenants, entities, users) to break cycles...');
    
    const preCreateTablesSql = `
      CREATE TABLE IF NOT EXISTS tenants (
          tenant_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          slug                TEXT NOT NULL UNIQUE,
          name                VARCHAR(150) NOT NULL,
          status              entity_status_enum NOT NULL DEFAULT 'active',
          created_by_user_id  UUID NULL,
          updated_by_user_id  UUID NULL,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT chk_tenants_slug_not_blank CHECK (btrim(slug) <> ''),
          CONSTRAINT chk_tenants_name_not_blank CHECK (btrim(name) <> '')
      );

      CREATE TABLE IF NOT EXISTS entities (
          entity_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          tenant_id           UUID NOT NULL REFERENCES tenants(tenant_id) ON DELETE CASCADE,
          parent_entity_id    UUID NULL REFERENCES entities(entity_id) ON DELETE SET NULL,
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
          CONSTRAINT chk_entities_name_not_blank CHECK (btrim(name) <> ''),
          CONSTRAINT chk_entities_slug_not_blank CHECK (btrim(slug) <> ''),
          CONSTRAINT uq_entities_tenant_slug UNIQUE (tenant_id, slug)
      );

      CREATE TABLE IF NOT EXISTS users (
          user_id             UUID PRIMARY KEY,
          primary_email       TEXT NOT NULL UNIQUE,
          password_hash       TEXT NULL,
          locale              TEXT NULL,
          preferred_language  TEXT NULL,
          state               user_state_enum NOT NULL DEFAULT 'pending',
          activated_at        TIMESTAMPTZ NULL,
          phone_number        TEXT UNIQUE,
          created_by_user_id  UUID NULL,
          updated_by_user_id  UUID NULL,
          created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          CONSTRAINT chk_users_email_not_blank CHECK (btrim(primary_email) <> '')
      );
    `;
    await client.query(preCreateTablesSql);
    console.log('✅ Core tables pre-created.');

    const dbDir = __dirname;
    const files = fs.readdirSync(dbDir).filter(f => f.endsWith('.sql'));

    // Exclude obsolete/redundant files
    const excludedFiles = [
      'entities.sql',
      'roles.sql',
      'role_assignments.sql',
      'group_memberships.sql',
      'idempotency.sql',
    ];

    const activeFiles = files.filter(f => !excludedFiles.includes(f));
    console.log(`Found ${activeFiles.length} active SQL files to apply.`);

    // Read and fix files on disk first
    for (const file of activeFiles) {
      const filePath = path.join(dbDir, file);
      let content = fs.readFileSync(filePath, 'utf8');
      let updated = false;

      if (content.includes('tenants(row_id)')) {
        content = content.replace(/tenants\(row_id\)/g, 'tenants(tenant_id)');
        updated = true;
      }
      if (content.includes('entities(row_id)')) {
        content = content.replace(/entities\(row_id\)/g, 'entities(entity_id)');
        updated = true;
      }
      if (content.includes('events(id)')) {
        content = content.replace(/events\(id\)/g, 'events(event_id)');
        updated = true;
      }

      if (updated) {
        fs.writeFileSync(filePath, content, 'utf8');
        console.log(`✏️ Fixed invalid references in ${file}`);
      }
    }

    // Define the execution order
    const priorityFiles = [
      'tenants.sql',
      'users.sql',
      'forms.sql',
      'form_response.sql',
      'entity_registry.sql',
      'form_fields.sql',
      'form_response_values.sql',
      'media_assets.sql',
      'events.sql',
      'profile_requirements.sql',
      'user_profiles.sql',
      'user_profile_links.sql',
      'user_profile_requirment_status.sql',
      'user_consents.sql',
      'categories.sql',
      'user_interest.sql',
      'auth_identities.sql',
      'forum_post.sql',
      'membership_tiers.sql',
      'reviews.sql',
      'referral_links.sql',
    ];

    const remainingFiles = activeFiles.filter(f => !priorityFiles.includes(f));
    const executionOrder = [...priorityFiles, ...remainingFiles];

    console.log('Applying table schemas...');

    // Run active files in order
    for (const file of executionOrder) {
      console.log(`Running: ${file}`);
      const filePath = path.join(dbDir, file);
      const content = fs.readFileSync(filePath, 'utf8');
      await client.query(content);
    }

    console.log('Base schemas successfully created.');
    console.log('Re-applying circular foreign key constraints...');

    // Apply ONLY the circular foreign key constraints back on core tables
    const alterStatements = [
      'ALTER TABLE tenants ADD CONSTRAINT fk_tenants_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',
      'ALTER TABLE tenants ADD CONSTRAINT fk_tenants_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',

      'ALTER TABLE entities ADD CONSTRAINT fk_entities_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',
      'ALTER TABLE entities ADD CONSTRAINT fk_entities_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',

      'ALTER TABLE users ADD CONSTRAINT fk_users_entity FOREIGN KEY (user_id) REFERENCES entities(entity_id) ON DELETE CASCADE;',
      'ALTER TABLE users ADD CONSTRAINT fk_users_created_by FOREIGN KEY (created_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',
      'ALTER TABLE users ADD CONSTRAINT fk_users_updated_by FOREIGN KEY (updated_by_user_id) REFERENCES users(user_id) ON DELETE SET NULL;',
    ];

    for (const sql of alterStatements) {
      await client.query(sql);
    }

    console.log('🎉 All database migrations completed successfully!');
  } catch (err: any) {
    console.error('❌ Migration failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.end();
  }
}

migrate();
