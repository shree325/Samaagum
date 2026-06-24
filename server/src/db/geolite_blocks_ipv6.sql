CREATE TABLE geolite_blocks_ipv6 (
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