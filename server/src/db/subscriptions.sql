CREATE TABLE IF NOT EXISTS subscriptions (
    subscription_id     UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_id             UUID NOT NULL,
    owner_entity_id     UUID NOT NULL,
    sub_name            VARCHAR(150) NOT NULL,
    sub_description     JSONB NOT NULL,

    valid_from          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_to            TIMESTAMPTZ NULL,
    state               subscription_state_enum NOT NULL DEFAULT 'pending',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_subscriptions_plan
        FOREIGN KEY (plan_id)
        REFERENCES plans(plan_id)
        ON DELETE RESTRICT,

    CONSTRAINT fk_subscriptions_owner_entity
        FOREIGN KEY (owner_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_subscriptions_valid_to
        CHECK (valid_to IS NULL OR valid_to >= valid_from),

    CONSTRAINT fk_subscriptions_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_subscriptions_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_subscriptions_plan_id
    ON subscriptions(plan_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_owner_entity_id
    ON subscriptions(owner_entity_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_state
    ON subscriptions(state);

CREATE INDEX IF NOT EXISTS idx_subscriptions_valid_from
    ON subscriptions(valid_from);

CREATE INDEX IF NOT EXISTS idx_subscriptions_valid_to
    ON subscriptions(valid_to);

CREATE INDEX IF NOT EXISTS idx_subscriptions_created_by_user_id
    ON subscriptions(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_subscriptions_updated_by_user_id
    ON subscriptions(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_subscriptions_audit ON subscriptions;
CREATE TRIGGER trg_subscriptions_audit
BEFORE INSERT OR UPDATE ON subscriptions
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
