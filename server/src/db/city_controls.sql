CREATE TABLE city_controls (
    geoname_id BIGINT PRIMARY KEY,

    city_name VARCHAR(255) NOT NULL,
    state_name VARCHAR(255),
    country_name VARCHAR(255),

    latitude DECIMAL(10,6),
    longitude DECIMAL(10,6),
    timezone VARCHAR(100),

    is_active BOOLEAN DEFAULT TRUE,

    created_at TIMESTAMP DEFAULT NOW(),
    created_by VARCHAR(100),

    updated_at TIMESTAMP DEFAULT NOW(),
    updated_by VARCHAR(100),

    modification_num INTEGER DEFAULT 0
);