CREATE TABLE IF NOT EXISTS ratings (
    rating_id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    tenant_id           UUID NOT NULL,
    review_id           UUID NOT NULL,
    
    score               INTEGER NOT NULL,

    created_by_user_id  UUID NULL,
    updated_by_user_id  UUID NULL,
    modification_num    INTEGER NOT NULL DEFAULT 1,

    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_ratings_tenant
        FOREIGN KEY (tenant_id)
        REFERENCES tenants(tenant_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_ratings_review
        FOREIGN KEY (review_id)
        REFERENCES reviews(review_id)
        ON DELETE CASCADE,

    CONSTRAINT chk_ratings_score
        CHECK (score >= 1 AND score <= 5),

    CONSTRAINT fk_ratings_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_ratings_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_ratings_review
        UNIQUE (review_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_tenant_id
    ON ratings(tenant_id);

CREATE INDEX IF NOT EXISTS idx_ratings_review_id
    ON ratings(review_id);

CREATE INDEX IF NOT EXISTS idx_ratings_score
    ON ratings(score);

DROP TRIGGER IF EXISTS trg_ratings_audit ON ratings;
CREATE TRIGGER trg_ratings_audit
BEFORE INSERT OR UPDATE ON ratings
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();
