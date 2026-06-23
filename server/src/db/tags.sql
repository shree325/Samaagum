-- =====================================================================
-- Samaagum | Table: tags
-- =====================================================================

DROP TABLE IF EXISTS tags CASCADE;

CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Parent Category
    category_id UUID NOT NULL
        REFERENCES categories(id)
        ON DELETE CASCADE,

    -- Basic Info
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,

    -- Status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE tags
IS 'phase:MVP-0 | Event tags under categories';