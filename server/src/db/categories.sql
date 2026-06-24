-- =====================================================================
-- Samaagum | Table: categories
-- =====================================================================

DROP TABLE IF EXISTS categories CASCADE;

CREATE TABLE categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

    -- Hierarchy
    parent_id UUID REFERENCES categories(id) ON DELETE CASCADE,

    -- Basic Info
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,

    -- Category Type
    kind TEXT DEFAULT 'event',

    -- Display
    icon_type TEXT DEFAULT 'emoji',      -- emoji | library | upload
    icon_value TEXT,
    display_order INTEGER NOT NULL DEFAULT 999,

    -- Status
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),

    -- Soft Delete
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,

    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE categories
IS 'phase:MVP-0 | Event category taxonomy';