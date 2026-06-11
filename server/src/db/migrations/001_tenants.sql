-- =====================================================================
-- Migration 001: Tenants
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status entity_status NOT NULL DEFAULT 'active',
  default_currency currency_code NOT NULL DEFAULT 'INR',
  default_locale TEXT NOT NULL DEFAULT 'en',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
