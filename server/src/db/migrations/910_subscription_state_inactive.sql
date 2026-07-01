-- =====================================================================
-- Samaagum  |  Migration: Add inactive to subscription_state
-- =====================================================================

-- Safely add 'inactive' to the subscription_state ENUM if it does not already exist
-- Postgres requires this command to be run outside a transaction block if run dynamically, 
-- but IF NOT EXISTS safely handles idempotency.
ALTER TYPE subscription_state ADD VALUE IF NOT EXISTS 'inactive';
    