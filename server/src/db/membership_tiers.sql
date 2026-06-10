CREATE TABLE IF NOT EXISTS membership_tiers (
    tier_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    entity_id           UUID NOT NULL,

    name                VARCHAR(150) NOT NULL,
    description         JSONB NULL,
    is_free             BOOLEAN NOT NULL DEFAULT FALSE,
    price               DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    billing_cycle       TEXT NOT NULL DEFAULT 'monthly',
    entitlements        JSONB NOT NULL DEFAULT '{}'::jsonb,

    status              plan_status_enum NOT NULL DEFAULT 'draft',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_membership_tiers_name_not_blank
        CHECK (btrim(name) <> ''),

    CONSTRAINT fk_membership_tiers_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_tiers_entity
        FOREIGN KEY (entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_tiers_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_membership_tiers_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_tenant_id
    ON membership_tiers(tenant_id);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_entity_id
    ON membership_tiers(entity_id);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_status
    ON membership_tiers(status);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_created_by_user_id
    ON membership_tiers(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_membership_tiers_updated_by_user_id
    ON membership_tiers(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_membership_tiers_audit ON membership_tiers;
CREATE TRIGGER trg_membership_tiers_audit
BEFORE INSERT OR UPDATE ON membership_tiers
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
