-- Migration: Add attendee_status enum and update attendees table
CREATE TYPE attendee_status AS ENUM ('pending', 'approved', 'rejected', 'waitlisted', 'checked_in');
ALTER TABLE attendees ADD COLUMN status attendee_status NOT NULL DEFAULT 'pending';
