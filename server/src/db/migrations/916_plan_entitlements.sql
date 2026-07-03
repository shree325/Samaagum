-- =====================================================================
-- Migration 916: Seed Plan Entitlements for Free and Standard Plans
-- =====================================================================

-- 1. Create/Update core plans in core plans table
INSERT INTO plans (id, key, plan_type, version, entitlements, status)
VALUES 
  (gen_random_uuid(), 'free', 'free', 1, '{
    "group_max_groups": -1,
    "group_allowed_visibility": ["unlisted"],
    "group_allowed_join_modes": ["open", "invite_only"],
    "group_max_capacity": 25,
    "group_can_restricted_access": false,
    "event_allowed_registration_modes": ["free", "cash"],
    "event_allowed_visibility": ["unlisted", "invite_only"],
    "event_max_participants": 100,
    "event_checkin_methods": ["scanner", "manual", "gate"],
    "event_can_create_paid_tickets": false
  }'::jsonb, 'active'),
  (gen_random_uuid(), 'standard', 'monthly', 1, '{
    "group_max_groups": -1,
    "group_allowed_visibility": ["public", "unlisted", "restricted"],
    "group_allowed_join_modes": ["open", "invite_only", "restricted_access"],
    "group_max_capacity": -1,
    "group_can_restricted_access": true,
    "event_allowed_registration_modes": ["free", "cash", "paid"],
    "event_allowed_visibility": ["public", "unlisted", "invite_only"],
    "event_max_participants": -1,
    "event_checkin_methods": ["scanner", "manual", "gate"],
    "event_can_create_paid_tickets": true
  }'::jsonb, 'active')
ON CONFLICT (key) DO UPDATE
SET entitlements = EXCLUDED.entitlements;

-- 2. Create/Update admin_subscription_plans
INSERT INTO admin_subscription_plans (id, name, display_name, description, category, plan_type, is_active, is_popular, pricing, features, limits, metadata, visibility)
VALUES
  (gen_random_uuid(), 'free', 'Free Plan', 'Basic plan for casual users', 'individual', 'free', true, false, '{}'::jsonb, '[
    {"name": "Create unlimited unlisted groups"},
    {"name": "Up to 25 members per group"},
    {"name": "Create free or cash events up to 100 participants"},
    {"name": "Basic checkin methods available"}
  ]'::jsonb, '{
    "group_max_groups": -1,
    "group_allowed_visibility": ["unlisted"],
    "group_allowed_join_modes": ["open", "invite_only"],
    "group_max_capacity": 25,
    "group_can_restricted_access": false,
    "event_allowed_registration_modes": ["free", "cash"],
    "event_allowed_visibility": ["unlisted", "invite_only"],
    "event_max_participants": 100,
    "event_checkin_methods": ["scanner", "manual", "gate"],
    "event_can_create_paid_tickets": false
  }'::jsonb, '{}'::jsonb, '{}'::jsonb),
  (gen_random_uuid(), 'standard', 'Standard Plan', 'Premium features for professional hosts', 'individual', 'monthly', true, true, '{
    "monthly": {"amount": 499, "currency": "INR"},
    "yearly": {"amount": 4790, "currency": "INR"}
  }'::jsonb, '[
    {"name": "Create public and restricted groups"},
    {"name": "Unlimited group members"},
    {"name": "Paid ticket sales and paid event registration"},
    {"name": "Unlimited event participants"},
    {"name": "Full admin checkin features"}
  ]'::jsonb, '{
    "group_max_groups": -1,
    "group_allowed_visibility": ["public", "unlisted", "restricted"],
    "group_allowed_join_modes": ["open", "invite_only", "restricted_access"],
    "group_max_capacity": -1,
    "group_can_restricted_access": true,
    "event_allowed_registration_modes": ["free", "cash", "paid"],
    "event_allowed_visibility": ["public", "unlisted", "invite_only"],
    "event_max_participants": -1,
    "event_checkin_methods": ["scanner", "manual", "gate"],
    "event_can_create_paid_tickets": true
  }'::jsonb, '{}'::jsonb, '{}'::jsonb)
ON CONFLICT (name) DO UPDATE
SET display_name = EXCLUDED.display_name,
    description = EXCLUDED.description,
    features = EXCLUDED.features,
    pricing = EXCLUDED.pricing,
    limits = EXCLUDED.limits;
