CREATE TABLE IF NOT EXISTS reviews (
    review_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    reviewer_user_id    UUID NOT NULL,
    target_entity_id    UUID NOT NULL,

    content             JSONB NULL,
    status              visibility_enum NOT NULL DEFAULT 'public',

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_reviews_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_reviewer
        FOREIGN KEY (reviewer_user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_target_entity
        FOREIGN KEY (target_entity_id)
        REFERENCES entities(entity_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_reviews_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_reviews_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_reviews_reviewer_target
        UNIQUE (reviewer_user_id, target_entity_id)
);

CREATE INDEX IF NOT EXISTS idx_reviews_tenant_id
    ON reviews(tenant_id);

CREATE INDEX IF NOT EXISTS idx_reviews_reviewer_user_id
    ON reviews(reviewer_user_id);

CREATE INDEX IF NOT EXISTS idx_reviews_target_entity_id
    ON reviews(target_entity_id);

CREATE INDEX IF NOT EXISTS idx_reviews_status
    ON reviews(status);

DROP TRIGGER IF EXISTS trg_reviews_audit ON reviews;
CREATE TRIGGER trg_reviews_audit
BEFORE INSERT OR UPDATE ON reviews
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
