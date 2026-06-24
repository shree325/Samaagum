-- =====================================================================
-- Samaagum | Migration: 907_city_controls
-- City-level admin control powered by GeoLite2 data
-- =====================================================================

-- Enable earth_distance for future geo queries
CREATE EXTENSION IF NOT EXISTS cube;
CREATE EXTENSION IF NOT EXISTS earthdistance;

CREATE TABLE IF NOT EXISTS city_controls (
    geoname_id       BIGINT PRIMARY KEY,
    city_name        VARCHAR(150) NOT NULL,
    state_name       VARCHAR(150),
    country_name     VARCHAR(150),
    is_active        BOOLEAN NOT NULL DEFAULT TRUE,

    -- Audit fields (Samaagum conventions)
    created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by       TEXT,
    updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by       TEXT,
    modification_num INTEGER NOT NULL DEFAULT 0
);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_city_controls_city_name    ON city_controls (city_name);
CREATE INDEX IF NOT EXISTS idx_city_controls_state_name   ON city_controls (state_name);
CREATE INDEX IF NOT EXISTS idx_city_controls_country_name ON city_controls (country_name);
CREATE INDEX IF NOT EXISTS idx_city_controls_is_active    ON city_controls (is_active);
CREATE INDEX IF NOT EXISTS idx_city_controls_search       ON city_controls (city_name, state_name, country_name);

COMMENT ON TABLE city_controls IS 'phase:MVP-1 | Admin control for enabling/disabling cities for event/group/community creation';
