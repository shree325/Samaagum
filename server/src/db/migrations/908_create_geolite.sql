-- =====================================================================
-- Samaagum | Migration: 908_create_geolite
-- Create GeoLite2 locations and blocks tables if they do not exist
-- =====================================================================

CREATE TABLE IF NOT EXISTS geolite_locations (
    geoname_id BIGINT PRIMARY KEY,
    locale_code VARCHAR(10),
    continent_code VARCHAR(10),
    continent_name VARCHAR(100),
    country_iso_code VARCHAR(10),
    country_name VARCHAR(255),
    subdivision_1_iso_code VARCHAR(20),
    subdivision_1_name VARCHAR(255),
    subdivision_2_iso_code VARCHAR(20),
    subdivision_2_name VARCHAR(255),
    city_name VARCHAR(255),
    metro_code VARCHAR(50),
    time_zone VARCHAR(100),
    is_in_european_union BOOLEAN
);

CREATE TABLE IF NOT EXISTS geolite_blocks_ipv4 (
    network CIDR PRIMARY KEY,
    geoname_id BIGINT,
    registered_country_geoname_id BIGINT,
    represented_country_geoname_id BIGINT,
    is_anonymous_proxy BOOLEAN,
    is_satellite_provider BOOLEAN,
    postal_code VARCHAR(30),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    accuracy_radius INTEGER,
    is_anycast BOOLEAN
);

CREATE TABLE IF NOT EXISTS geolite_blocks_ipv6 (
    network CIDR PRIMARY KEY,
    geoname_id BIGINT,
    registered_country_geoname_id BIGINT,
    represented_country_geoname_id BIGINT,
    is_anonymous_proxy BOOLEAN,
    is_satellite_provider BOOLEAN,
    postal_code VARCHAR(30),
    latitude NUMERIC(10,6),
    longitude NUMERIC(10,6),
    accuracy_radius INTEGER,
    is_anycast BOOLEAN
);
