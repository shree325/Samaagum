-- Commit the current transaction because ALTER TYPE ADD VALUE cannot run inside a transaction block
COMMIT;

ALTER TYPE booking_status ADD VALUE IF NOT EXISTS 'refunded-offline';

-- Restart transaction
BEGIN;

ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_instructions TEXT;
ALTER TABLE events ADD COLUMN IF NOT EXISTS payment_hold_hours INT DEFAULT 48;
ALTER TABLE bookings ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;
ALTER TABLE event_registration_log ADD COLUMN IF NOT EXISTS booking_id UUID REFERENCES bookings(id) ON DELETE CASCADE;
ALTER TABLE event_registration_log ADD COLUMN IF NOT EXISTS remarks TEXT;
