-- =====================================================================
-- Samaagum | Migration: 908_add_city_coordinates
-- Add latitude, longitude, and timezone to city_controls table
-- =====================================================================

ALTER TABLE city_controls
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(10,6),
ADD COLUMN IF NOT EXISTS timezone VARCHAR(100);
