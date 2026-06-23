-- =====================================================================
-- Samaagum | Seed: city_controls from geolite_locations
-- Populates ALL countries — SAMAGAM is a global platform
-- =====================================================================

-- Insert distinct cities where city_name is not null
-- Uses DISTINCT ON (geoname_id) to avoid duplicates across locale rows
INSERT INTO city_controls (
    geoname_id, 
    city_name, 
    state_name, 
    country_name, 
    timezone,
    latitude,
    longitude,
    created_by
)
SELECT DISTINCT ON (l.geoname_id)
    l.geoname_id,
    l.city_name,
    l.subdivision_1_name,
    l.country_name,
    l.time_zone,
    b.latitude,
    b.longitude,
    'system-seed'
FROM geolite_locations l
LEFT JOIN LATERAL (
    SELECT latitude, longitude 
    FROM geolite_blocks_ipv4 
    WHERE geoname_id = l.geoname_id 
      AND latitude IS NOT NULL 
    LIMIT 1
) b ON true
WHERE l.city_name IS NOT NULL
  AND l.geoname_id IS NOT NULL
ORDER BY l.geoname_id
ON CONFLICT (geoname_id) DO UPDATE SET
    latitude = EXCLUDED.latitude,
    longitude = EXCLUDED.longitude,
    timezone = EXCLUDED.timezone;
-- Report count
DO $$
DECLARE
    cnt BIGINT;
BEGIN
    SELECT COUNT(*) INTO cnt FROM city_controls;
    RAISE NOTICE 'city_controls seeded with % cities', cnt;
END $$;
