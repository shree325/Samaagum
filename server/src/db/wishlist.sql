CREATE TABLE IF NOT EXISTS wishlists (
    wishlist_id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    user_id              UUID NOT NULL,
    event_id             UUID NOT NULL,

    created_by_user_id   UUID NULL,
    updated_by_user_id   UUID NULL,
    modification_num     INTEGER NOT NULL DEFAULT 1,

    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),

    CONSTRAINT fk_wishlists_user
        FOREIGN KEY (user_id)
        REFERENCES users(user_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_wishlists_event
        FOREIGN KEY (event_id)
        REFERENCES events(event_id)
        ON DELETE CASCADE,

    CONSTRAINT fk_wishlists_created_by
        FOREIGN KEY (created_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT fk_wishlists_updated_by
        FOREIGN KEY (updated_by_user_id)
        REFERENCES users(user_id)
        ON DELETE SET NULL,

    CONSTRAINT uq_wishlists_user_event
        UNIQUE (user_id, event_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user_id
    ON wishlists(user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_event_id
    ON wishlists(event_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_created_by_user_id
    ON wishlists(created_by_user_id);

CREATE INDEX IF NOT EXISTS idx_wishlists_updated_by_user_id
    ON wishlists(updated_by_user_id);

DROP TRIGGER IF EXISTS trg_wishlists_audit ON wishlists;
CREATE TRIGGER trg_wishlists_audit
BEFORE INSERT OR UPDATE ON wishlists
FOR EACH ROW
EXECUTE FUNCTION fn_set_audit_fields();