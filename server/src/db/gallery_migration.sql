CREATE TABLE IF NOT EXISTS group_gallery (
    id               UUID         PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id        UUID         NOT NULL,
    group_id         UUID         NOT NULL,
    uploader_user_id UUID         NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    url              TEXT         NOT NULL,
    type             VARCHAR(10)  NOT NULL DEFAULT 'image',
    status           VARCHAR(20)  NOT NULL DEFAULT 'approved',
    created_at       TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_group_gallery_group ON group_gallery(group_id);
