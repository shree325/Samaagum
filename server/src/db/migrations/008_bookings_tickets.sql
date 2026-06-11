-- =====================================================================
-- Migration 008: Bookings, Tickets & Check-in
-- Phase: MVP-0
-- =====================================================================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  booker_user_id UUID NOT NULL REFERENCES users(id),
  status booking_status NOT NULL DEFAULT 'pending_payment',
  payment_method payment_method NOT NULL DEFAULT 'free',
  hold_expires_at TIMESTAMPTZ,
  total_amount_minor BIGINT,
  total_currency currency_code,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE booking_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  addon_id UUID,  -- FK deferred (addons table created in Phase-1.5)
  quantity INT NOT NULL DEFAULT 1,
  unit_price_amount_minor BIGINT,
  unit_price_currency currency_code,
  line_status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  line_item_id UUID NOT NULL REFERENCES booking_line_items(id),
  attendee_name TEXT,
  attendee_email CITEXT,
  attendee_gender TEXT,
  qr_token TEXT UNIQUE NOT NULL,
  status ticket_status NOT NULL DEFAULT 'reserved',
  claimed_by_user_id UUID REFERENCES users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE ticket_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  token TEXT UNIQUE NOT NULL,
  state claim_state NOT NULL DEFAULT 'issued',
  expires_at TIMESTAMPTZ,
  claimed_at TIMESTAMPTZ
);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  method checkin_method NOT NULL,
  staff_user_id UUID NOT NULL REFERENCES users(id),
  gate TEXT,
  reversed BOOLEAN NOT NULL DEFAULT false,
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
