-- Migration: Add is_default to admin_subscription_plans and set Free Plan as default

ALTER TABLE admin_subscription_plans ADD COLUMN IF NOT EXISTS is_default BOOLEAN DEFAULT false;

UPDATE admin_subscription_plans SET is_default = false WHERE is_default = true;

UPDATE admin_subscription_plans
SET is_default = true, updated_at = now()
WHERE LOWER(name) = 'free' OR plan_type = 'free';

-- Verify
SELECT id, name, display_name, is_default FROM admin_subscription_plans ORDER BY is_default DESC;
