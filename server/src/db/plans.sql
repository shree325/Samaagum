CREATE TABLE IF NOT EXISTS plans (
    plan_id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    plan_type           TEXT NOT NULL,
    plane_name          TEXT NOT NULL,
    entitlements        JSONB NOT NULL DEFAULT '{}'::jsonb,
    status              plan_status_enum NOT NULL DEFAULT 'draft',
    price               DECIMAL(10, 2) NOT NULL DEFAULT 0,
    currency            VARCHAR(3) NOT NULL DEFAULT 'INR',
    billing_cycle       TEXT NOT NULL DEFAULT 'monthly',


    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT chk_plans_plan_type_not_blank
        CHECK (btrim(plan_type) <> ''),

    CONSTRAINT fk_plans_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_plans_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_plans_plan_type
    ON plans(plan_type);

CREATE INDEX IF NOT EXISTS idx_plans_status
    ON plans(status);

CREATE INDEX IF NOT EXISTS idx_plans_created_by_user_id
    ON plans(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_plans_updated_by_user_id
    ON plans(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_plans_audit ON plans;
CREATE TRIGGER trg_plans_audit
BEFORE INSERT OR UPDATE ON plans
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
