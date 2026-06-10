CREATE TABLE IF NOT EXISTS membership_subscriptions (
    subscription_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    tier_id             UUID NOT NULL,
    user_id             UUID NOT NULL,

    status              subscription_state_enum NOT NULL DEFAULT 'pending',
    valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to            TIMESTAMPTZ NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_membership_subscriptions_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_membership_subscriptions_tier
        FOREIGN KEY (tier_id)
        REFERENCES membership_tiers(tier_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_membership_subscriptions_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_membership_subscriptions_valid_to
        CHECK (valid_to IS NULL OR valid_to >= valid_from),

    CONSTRAINT fk_membership_subscriptions_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_membership_subscriptions_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_tenant_id
    ON membership_subscriptions(tenant_id);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_tier_id
    ON membership_subscriptions(tier_id);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_user_id
    ON membership_subscriptions(user_id);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_status
    ON membership_subscriptions(status);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_valid_from
    ON membership_subscriptions(valid_from);

CREATE INDEX IF NOT EXISTS idx_membership_subscriptions_valid_to
    ON membership_subscriptions(valid_to);

DROP TRIGGER IF EXISTS trg_membership_subscriptions_audit ON membership_subscriptions;
CREATE TRIGGER trg_membership_subscriptions_audit
BEFORE INSERT OR UPDATE ON membership_subscriptions
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
