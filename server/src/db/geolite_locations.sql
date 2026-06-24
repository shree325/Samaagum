CREATE TABLE geolite_locations (
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