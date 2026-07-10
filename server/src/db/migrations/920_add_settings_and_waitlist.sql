-- =====================================================================
-- Samaagum  |  Migration: Add settings and waitlist support
-- =====================================================================

ALTER TABLE events ADD COLUMN IF NOT EXISTS settings JSONB;
ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'waitlisted';
ALTER TYPE ticket_status ADD VALUE IF NOT EXISTS 'waitlisted';
