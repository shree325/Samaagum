-- ---------- DOMAINS ----------
CREATE DOMAIN currency_code AS CHAR(3) CHECK (VALUE ~ '^[A-Z]{3}$');

-- ---------- ENUMS ----------
CREATE TYPE user_state          AS ENUM ('provisional','active','suspended','deleted');
CREATE TYPE entity_type         AS ENUM ('user','org','community','sub_community','group','collaboration');
CREATE TYPE entity_status       AS ENUM ('active','suspended','archived','deleted');
CREATE TYPE visibility_level    AS ENUM ('public','community','group','invite_only','link_based','private');
CREATE TYPE listed_state        AS ENUM ('unlisted','listed');
CREATE TYPE join_mode           AS ENUM ('open','approval');
CREATE TYPE membership_state    AS ENUM ('pending','active','rejected','left','removed');
CREATE TYPE role_level          AS ENUM ('platform','org','community','sub_community','group','event','commercial','participation');
CREATE TYPE requirement_level   AS ENUM ('blocking','prompt','optional');
CREATE TYPE requirement_status  AS ENUM ('not_applicable','unsatisfied','satisfied','revalidation_due','snoozed');
CREATE TYPE form_field_type     AS ENUM ('short_text','long_text','number','dropdown','multi_select','checkbox','date','file');
CREATE TYPE form_purpose        AS ENUM ('group_join','event_registration','other');
CREATE TYPE subscription_state  AS ENUM ('active','grace','expired','cancelled');
CREATE TYPE event_kind          AS ENUM ('standalone','parent','session');
CREATE TYPE event_status        AS ENUM ('draft','published','cancelled','completed');
CREATE TYPE location_type       AS ENUM ('venue','online');
CREATE TYPE registration_mode   AS ENUM ('paid','free_rsvp');
CREATE TYPE ticket_visibility   AS ENUM ('public','private','bundle_only');
CREATE TYPE booking_status      AS ENUM ('pending_payment','pending_approval','confirmed','expired','cancelled','refunded');
CREATE TYPE payment_method      AS ENUM ('razorpay','cash','free');
CREATE TYPE payment_status      AS ENUM ('initiated','authorized','captured','failed','refund_pending','refunded','pending_confirmation','rejected','expired');
CREATE TYPE ticket_status       AS ENUM ('reserved','confirmed','checked_in','cancelled','refunded');
CREATE TYPE claim_state         AS ENUM ('issued','claimed','expired','revoked');
CREATE TYPE checkin_method      AS ENUM ('qr','booking_id','ticket_id','attendee_search');
CREATE TYPE refund_status       AS ENUM ('requested','approved','processing','completed','failed');
CREATE TYPE refund_mode         AS ENUM ('gateway','offline');
CREATE TYPE coupon_discount     AS ENUM ('flat','percent');
CREATE TYPE connection_state    AS ENUM ('requested','accepted','declined','blocked');
CREATE TYPE conversation_type   AS ENUM ('dm','organizer_inbox');
CREATE TYPE collaboration_state AS ENUM ('invited','accepted','declined','exited','revoked');
CREATE TYPE content_status      AS ENUM ('active','hidden','removed');
CREATE TYPE review_status       AS ENUM ('pending','published','removed');
CREATE TYPE waitlist_state      AS ENUM ('queued','offered','converted','lapsed');
CREATE TYPE settlement_status   AS ENUM ('eligible','scheduled','paid','disputed','frozen');
CREATE TYPE takeover_state      AS ENUM ('requested','admin_review','approved','declined','transferred');
CREATE TYPE listing_state       AS ENUM ('draft','listed','under_offer','sold','withdrawn');
CREATE TYPE assignment_state    AS ENUM ('invited','active','revoked','expired');

-- ---------- updated_at trigger fn ----------
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;


-- ================= 1. TENANCY & PLATFORM CORE =================

CREATE TABLE tenants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status entity_status NOT NULL DEFAULT 'active',
  default_currency currency_code NOT NULL DEFAULT 'INR',
  default_locale TEXT NOT NULL DEFAULT 'en',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================= 2. IDENTITY & PROFILES =================

CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  primary_email CITEXT,
  email_verified BOOLEAN NOT NULL DEFAULT false,
  state user_state NOT NULL DEFAULT 'provisional',
  locale TEXT NOT NULL DEFAULT 'en',
  preferred_currency currency_code,
  gender TEXT,
  dob DATE,
  phone_e164 TEXT,
  profile_completed BOOLEAN NOT NULL DEFAULT false,
  activated_at timestamptz,
  deleted_at timestamptz,
  UNIQUE (tenant_id, primary_email),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE auth_identities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  provider TEXT NOT NULL,
  provider_uid TEXT NOT NULL,
  UNIQUE (provider, provider_uid),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE user_consents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  consent_type TEXT NOT NULL,
  version TEXT NOT NULL,
  granted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_id UUID REFERENCES categories(id),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  kind TEXT
);

CREATE TABLE profiles (
  user_id UUID PRIMARY KEY REFERENCES users(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  display_name TEXT,
  bio TEXT,
  photo_asset_id UUID,
  cover_asset_id UUID,
  preferred_location TEXT,
  location_lat DOUBLE PRECISION,
  location_lng DOUBLE PRECISION,
  template_key TEXT,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE profile_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL,
  label TEXT,
  value TEXT,
  position INT NOT NULL DEFAULT 0,
  visibility visibility_level NOT NULL DEFAULT 'public'
);

CREATE TABLE user_interests (
  user_id UUID NOT NULL REFERENCES users(id),
  category_id UUID NOT NULL REFERENCES categories(id),
  PRIMARY KEY (user_id, category_id)
);

CREATE TABLE profile_requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  attribute_key TEXT NOT NULL,
  level requirement_level NOT NULL,
  audience TEXT NOT NULL DEFAULT 'all_users',
  revalidate_after INTERVAL,
  active BOOLEAN NOT NULL DEFAULT true
);

CREATE TABLE profile_requirement_status (
  user_id UUID NOT NULL REFERENCES users(id),
  requirement_id UUID NOT NULL REFERENCES profile_requirements(id),
  status requirement_status NOT NULL DEFAULT 'unsatisfied',
  satisfied_at timestamptz,
  last_prompted_at timestamptz,
  PRIMARY KEY (user_id, requirement_id)
);

-- ================= 3. ENTITY REGISTRY & HIERARCHY =================

CREATE TABLE entities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_type entity_type NOT NULL,
  parent_entity_id UUID REFERENCES entities(id),
  user_id UUID REFERENCES users(id),
  status entity_status NOT NULL DEFAULT 'active',
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE orgs (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  legal_name TEXT,
  branding JSONB,
  primary_domain TEXT
);

CREATE TABLE communities (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  name TEXT NOT NULL,
  slug TEXT,
  is_sub_community BOOLEAN NOT NULL DEFAULT false,
  kyc_verified BOOLEAN NOT NULL DEFAULT false,
  listed listed_state NOT NULL DEFAULT 'unlisted'
);

CREATE TABLE groups (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  name TEXT NOT NULL,
  slug TEXT,
  join_mode join_mode NOT NULL DEFAULT 'open',
  join_form_id UUID,
  listed listed_state NOT NULL DEFAULT 'unlisted'
);

CREATE TABLE group_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_id UUID NOT NULL REFERENCES entities(id),
  user_id UUID NOT NULL REFERENCES users(id),
  state membership_state NOT NULL DEFAULT 'pending',
  form_response_id UUID,
  joined_at timestamptz,
  UNIQUE (group_id, user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE collaborations (
  entity_id UUID PRIMARY KEY REFERENCES entities(id),
  primary_event_id UUID,
  state collaboration_state NOT NULL DEFAULT 'invited'
);

CREATE TABLE collaboration_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  collaboration_id UUID NOT NULL REFERENCES entities(id),
  member_entity_id UUID NOT NULL REFERENCES entities(id),
  state collaboration_state NOT NULL DEFAULT 'invited',
  is_founding BOOLEAN NOT NULL DEFAULT false
);

-- ================= 4. RBAC =================

CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  level role_level NOT NULL,
  phase TEXT NOT NULL DEFAULT 'MVP-0',
  reserved BOOLEAN NOT NULL DEFAULT false,
  baseline_capabilities JSONB NOT NULL DEFAULT '[]'
);

CREATE TABLE role_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  scope_entity_id UUID REFERENCES entities(id),
  restrictions JSONB,
  granted_by UUID REFERENCES users(id),
  expires_at timestamptz,
  UNIQUE (user_id, role_id, scope_entity_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================= 5. SUBSCRIPTIONS & ENTITLEMENTS =================

CREATE TABLE plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  plan_type TEXT NOT NULL,
  version INT NOT NULL DEFAULT 1,
  entitlements JSONB NOT NULL DEFAULT '{}',
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  plan_id UUID NOT NULL REFERENCES plans(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  state subscription_state NOT NULL DEFAULT 'active',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  grace_until timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE feature_flags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  flag_key TEXT NOT NULL,
  scope_entity_id UUID REFERENCES entities(id),
  value JSONB NOT NULL,
  UNIQUE (flag_key, scope_entity_id)
);

CREATE TABLE membership_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT, price_currency currency_code,
  benefits JSONB,
  status TEXT NOT NULL DEFAULT 'active'
);

CREATE TABLE membership_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  tier_id UUID NOT NULL REFERENCES membership_tiers(id),
  user_id UUID NOT NULL REFERENCES users(id),
  state subscription_state NOT NULL DEFAULT 'active',
  valid_from timestamptz NOT NULL DEFAULT now(),
  valid_to timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================= 6. FORM BUILDER (shared) =================

CREATE TABLE forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  purpose form_purpose NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE form_fields (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES forms(id),
  field_type form_field_type NOT NULL,
  label TEXT NOT NULL,
  required BOOLEAN NOT NULL DEFAULT false,
  options JSONB,
  conditions JSONB,
  field_scope TEXT NOT NULL DEFAULT 'booking',
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE form_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  form_id UUID NOT NULL REFERENCES forms(id),
  respondent_user_id UUID REFERENCES users(id),
  context_ref UUID,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE form_response_values (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  response_id UUID NOT NULL REFERENCES form_responses(id),
  field_id UUID NOT NULL REFERENCES form_fields(id),
  value JSONB
);

-- ================= 7. EVENTS & TICKETING =================

CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  hosted_by_entity_id UUID NOT NULL REFERENCES entities(id),
  parent_event_id UUID REFERENCES events(id),
  event_kind event_kind NOT NULL DEFAULT 'standalone',
  title TEXT NOT NULL,
  description TEXT,
  status event_status NOT NULL DEFAULT 'draft',
  starts_at timestamptz,
  ends_at timestamptz,
  venue_timezone TEXT,
  location_type location_type NOT NULL DEFAULT 'venue',
  venue JSONB,
  online_link TEXT,
  capacity_total INT,
  registration_mode registration_mode NOT NULL DEFAULT 'paid',
  approval_required BOOLEAN NOT NULL DEFAULT false,
  registration_form_id UUID REFERENCES forms(id),
  cash_enabled BOOLEAN NOT NULL DEFAULT false,
  financial_locked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  description TEXT,
  price_amount_minor BIGINT, price_currency currency_code,
  capacity INT,
  max_per_booking INT,
  sale_start timestamptz,
  sale_end timestamptz,
  early_bird_price_amount_minor BIGINT, early_bird_price_currency currency_code,
  early_bird_ends_at timestamptz,
  visibility ticket_visibility NOT NULL DEFAULT 'public',
  eligibility JSONB,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE event_team_assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role_id UUID NOT NULL REFERENCES roles(id),
  state assignment_state NOT NULL DEFAULT 'active',
  granted_by UUID REFERENCES users(id),
  expires_at timestamptz,
  UNIQUE (event_id, user_id, role_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE bundles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  parent_event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT, price_currency currency_code,
  max_bundles INT,
  max_per_booking INT
);

CREATE TABLE bundle_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  bundle_id UUID NOT NULL REFERENCES bundles(id),
  ticket_type_id UUID NOT NULL REFERENCES ticket_types(id),
  quantity INT NOT NULL DEFAULT 1
);

CREATE TABLE addons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT, price_currency currency_code,
  inventory INT,
  level TEXT NOT NULL DEFAULT 'attendee'
);

-- ================= 8. BOOKING, TICKETS & CHECK-IN =================

CREATE TABLE bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  booker_user_id UUID NOT NULL REFERENCES users(id),
  status booking_status NOT NULL DEFAULT 'pending_payment',
  payment_method payment_method NOT NULL DEFAULT 'free',
  hold_expires_at timestamptz,
  total_amount_minor BIGINT, total_currency currency_code,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE booking_line_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  addon_id UUID REFERENCES addons(id),
  quantity INT NOT NULL DEFAULT 1,
  unit_price_amount_minor BIGINT, unit_price_currency currency_code,
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
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ticket_claims (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  token TEXT UNIQUE NOT NULL,
  state claim_state NOT NULL DEFAULT 'issued',
  expires_at timestamptz,
  claimed_at timestamptz
);

CREATE TABLE checkins (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  ticket_id UUID NOT NULL REFERENCES tickets(id),
  method checkin_method NOT NULL,
  staff_user_id UUID NOT NULL REFERENCES users(id),
  gate TEXT,
  reversed BOOLEAN NOT NULL DEFAULT false,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE waitlist_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  ticket_type_id UUID REFERENCES ticket_types(id),
  user_id UUID NOT NULL REFERENCES users(id),
  position INT,
  state waitlist_state NOT NULL DEFAULT 'queued',
  hold_payment_id UUID,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================= 9. PAYMENTS & LEDGER =================

CREATE TABLE payments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  method payment_method NOT NULL,
  status payment_status NOT NULL DEFAULT 'initiated',
  gateway_order_id TEXT,
  gateway_payment_id TEXT,
  amount_amount_minor BIGINT, amount_currency currency_code,
  proof_asset_id UUID,
  UNIQUE (gateway_payment_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE refunds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  payment_id UUID NOT NULL REFERENCES payments(id),
  line_item_id UUID REFERENCES booking_line_items(id),
  amount_amount_minor BIGINT, amount_currency currency_code,
  mode refund_mode NOT NULL DEFAULT 'gateway',
  status refund_status NOT NULL DEFAULT 'requested',
  reason TEXT,
  maker_user_id UUID REFERENCES users(id),
  checker_user_id UUID REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ledger_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  key TEXT NOT NULL,
  owner_entity_id UUID REFERENCES entities(id),
  UNIQUE (tenant_id, key, owner_entity_id)
);

CREATE TABLE ledger_journals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  journal_type TEXT NOT NULL,
  source_type TEXT,
  source_id UUID,
  posted_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ledger_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  journal_id UUID NOT NULL REFERENCES ledger_journals(id),
  account_id UUID NOT NULL REFERENCES ledger_accounts(id),
  debit_minor BIGINT NOT NULL DEFAULT 0,
  credit_minor BIGINT NOT NULL DEFAULT 0,
  currency currency_code NOT NULL
);

CREATE TABLE settlements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  status settlement_status NOT NULL DEFAULT 'eligible',
  amount_amount_minor BIGINT, amount_currency currency_code,
  scheduled_for timestamptz,
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE settlement_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  settlement_id UUID NOT NULL REFERENCES settlements(id),
  journal_id UUID REFERENCES ledger_journals(id),
  amount_amount_minor BIGINT, amount_currency currency_code
);

CREATE TABLE coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  code TEXT NOT NULL,
  discount_type coupon_discount NOT NULL,
  discount_amount_minor BIGINT, discount_currency currency_code,
  discount_percent NUMERIC(5,2),
  valid_from timestamptz,
  valid_to timestamptz,
  max_total INT,
  max_per_user INT,
  status TEXT NOT NULL DEFAULT 'active',
  UNIQUE (event_id, code),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE coupon_redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  coupon_id UUID NOT NULL REFERENCES coupons(id),
  booking_id UUID NOT NULL REFERENCES bookings(id),
  line_item_id UUID REFERENCES booking_line_items(id),
  user_id UUID NOT NULL REFERENCES users(id),
  discount_applied_amount_minor BIGINT, discount_applied_currency currency_code
);

-- ================= 10. MEDIA & COMMUNITY CONTENT =================

CREATE TABLE media_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID REFERENCES entities(id),
  owner_user_id UUID REFERENCES users(id),
  storage_key TEXT NOT NULL,
  mime TEXT,
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE galleries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  event_id UUID REFERENCES events(id),
  title TEXT,
  visibility visibility_level NOT NULL DEFAULT 'public',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE gallery_media (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  gallery_id UUID NOT NULL REFERENCES galleries(id),
  asset_id UUID NOT NULL REFERENCES media_assets(id),
  caption TEXT,
  position INT NOT NULL DEFAULT 0
);

CREATE TABLE forum_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  scope_type TEXT NOT NULL,
  scope_id UUID NOT NULL,
  author_user_id UUID NOT NULL REFERENCES users(id),
  title TEXT,
  body TEXT,
  pinned BOOLEAN NOT NULL DEFAULT false,
  status content_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE forum_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  post_id UUID NOT NULL REFERENCES forum_posts(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  status content_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE wishlists (
  user_id UUID NOT NULL REFERENCES users(id),
  event_id UUID NOT NULL REFERENCES events(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, event_id)
);

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  body TEXT,
  status review_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE ratings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  review_id UUID REFERENCES reviews(id),
  author_user_id UUID NOT NULL REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  dimension TEXT NOT NULL DEFAULT 'overall',
  score SMALLINT NOT NULL CHECK (score BETWEEN 1 AND 5)
);

-- ================= 11. MESSAGING & SOCIAL =================

CREATE TABLE connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  requester_user_id UUID NOT NULL REFERENCES users(id),
  addressee_user_id UUID NOT NULL REFERENCES users(id),
  state connection_state NOT NULL DEFAULT 'requested',
  UNIQUE (requester_user_id, addressee_user_id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  type conversation_type NOT NULL DEFAULT 'dm',
  event_id UUID REFERENCES events(id),
  created_by UUID REFERENCES users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE conversation_participants (
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  user_id UUID NOT NULL REFERENCES users(id),
  role TEXT NOT NULL DEFAULT 'member',
  last_read_at timestamptz,
  PRIMARY KEY (conversation_id, user_id)
);

CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  conversation_id UUID NOT NULL REFERENCES conversations(id),
  sender_user_id UUID NOT NULL REFERENCES users(id),
  body TEXT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE entity_pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID NOT NULL REFERENCES entities(id),
  content JSONB,
  listed listed_state NOT NULL DEFAULT 'unlisted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE follows (
  user_id UUID NOT NULL REFERENCES users(id),
  entity_id UUID NOT NULL REFERENCES entities(id),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, entity_id)
);

-- ================= 12. COMMERCIAL =================

CREATE TABLE affiliates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID NOT NULL REFERENCES users(id),
  status TEXT NOT NULL DEFAULT 'active',
  wallet_balance_amount_minor BIGINT, wallet_balance_currency currency_code,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE referral_links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  event_id UUID REFERENCES events(id),
  code TEXT UNIQUE NOT NULL,
  commission_rule JSONB,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE referral_clicks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  referral_link_id UUID NOT NULL REFERENCES referral_links(id),
  clicked_at timestamptz NOT NULL DEFAULT now(),
  ip_hash TEXT,
  user_agent TEXT,
  converted_booking_id UUID REFERENCES bookings(id)
);

CREATE TABLE affiliate_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  referral_link_id UUID REFERENCES referral_links(id),
  booking_id UUID REFERENCES bookings(id),
  amount_amount_minor BIGINT, amount_currency currency_code,
  status TEXT NOT NULL DEFAULT 'accrued',
  journal_id UUID REFERENCES ledger_journals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE affiliate_payouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  affiliate_id UUID NOT NULL REFERENCES affiliates(id),
  amount_amount_minor BIGINT, amount_currency currency_code,
  status TEXT NOT NULL DEFAULT 'requested',
  journal_id UUID REFERENCES ledger_journals(id),
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sponsors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_id UUID REFERENCES entities(id),
  name TEXT NOT NULL,
  profile JSONB,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE sponsorship_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_id UUID NOT NULL REFERENCES events(id),
  name TEXT NOT NULL,
  price_amount_minor BIGINT, price_currency currency_code,
  assets JSONB
);

CREATE TABLE sponsorship_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  package_id UUID NOT NULL REFERENCES sponsorship_packages(id),
  sponsor_id UUID NOT NULL REFERENCES sponsors(id),
  status TEXT NOT NULL DEFAULT 'pending',
  journal_id UUID REFERENCES ledger_journals(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE takeover_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  buyer_user_id UUID NOT NULL REFERENCES users(id),
  state takeover_state NOT NULL DEFAULT 'requested',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ================= 13. PLATFORM SERVICES & AUDIT =================

CREATE TABLE domain_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  event_type TEXT NOT NULL,
  schema_version INT NOT NULL DEFAULT 1,
  aggregate_type TEXT NOT NULL,
  aggregate_id UUID NOT NULL,
  actor_user_id UUID,
  correlation_id UUID,
  causation_id UUID,
  payload JSONB NOT NULL DEFAULT '{}',
  occurred_at timestamptz NOT NULL DEFAULT now(),
  published_at timestamptz
);

CREATE TABLE audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  actor_user_id UUID,
  action TEXT NOT NULL,
  target_type TEXT,
  target_id UUID,
  before JSONB,
  after JSONB,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE idempotency_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  scope TEXT NOT NULL,
  key TEXT NOT NULL,
  response_hash TEXT,
  first_seen_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope, key)
);

CREATE TABLE notification_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID REFERENCES users(id),
  channel TEXT NOT NULL,
  template_key TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued',
  provider_ref TEXT,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  user_id UUID,
  signal_type TEXT NOT NULL,
  subject_type TEXT,
  subject_id UUID,
  occurred_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE impersonation_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  admin_user_id UUID NOT NULL REFERENCES users(id),
  target_user_id UUID NOT NULL REFERENCES users(id),
  reason TEXT,
  read_only BOOLEAN NOT NULL DEFAULT true,
  started_at timestamptz NOT NULL DEFAULT now(),
  ended_at timestamptz
);

-- ================= 14. PHASE-2 PROVISIONAL (specs may evolve) =================

CREATE TABLE marketplace_listings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  group_entity_id UUID NOT NULL REFERENCES entities(id),
  seller_user_id UUID NOT NULL REFERENCES users(id),
  state listing_state NOT NULL DEFAULT 'draft',
  asking_price_amount_minor BIGINT, asking_price_currency currency_code,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE marketplace_bids (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  listing_id UUID NOT NULL REFERENCES marketplace_listings(id),
  bidder_user_id UUID NOT NULL REFERENCES users(id),
  bid_amount_minor BIGINT, bid_currency currency_code,
  status TEXT NOT NULL DEFAULT 'open',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  criteria JSONB
);

CREATE TABLE user_badges (
  user_id UUID NOT NULL REFERENCES users(id),
  badge_id UUID NOT NULL REFERENCES badges(id),
  awarded_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, badge_id)
);

CREATE TABLE api_clients (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID REFERENCES entities(id),
  name TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES api_clients(id),
  key_hash TEXT NOT NULL,
  scopes JSONB,
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE outbound_webhooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id UUID NOT NULL REFERENCES api_clients(id),
  url TEXT NOT NULL,
  event_types JSONB,
  secret TEXT,
  active BOOLEAN NOT NULL DEFAULT true
);

-- ================= 13b. ADMIN & OPERATIONS WORKFLOWS =================

CREATE TABLE moderation_reports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  reporter_user_id UUID REFERENCES users(id),
  target_type TEXT NOT NULL,
  target_id UUID NOT NULL,
  reason TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  resolution TEXT,
  handled_by UUID REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kyc_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  entity_id UUID NOT NULL REFERENCES entities(id),
  submitted_by UUID REFERENCES users(id),
  documents JSONB,
  state TEXT NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE kyc_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  submission_id UUID NOT NULL REFERENCES kyc_submissions(id),
  reviewer_user_id UUID REFERENCES users(id),
  decision TEXT NOT NULL DEFAULT 'pending',
  notes TEXT,
  decided_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE support_cases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  raised_by_user_id UUID REFERENCES users(id),
  subject TEXT,
  category TEXT,
  state TEXT NOT NULL DEFAULT 'open',
  priority TEXT NOT NULL DEFAULT 'normal',
  related_type TEXT,
  related_id UUID,
  assigned_to UUID REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE disputes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  support_case_id UUID REFERENCES support_cases(id),
  booking_id UUID REFERENCES bookings(id),
  payment_id UUID REFERENCES payments(id),
  state TEXT NOT NULL DEFAULT 'open',
  outcome TEXT,
  handled_by UUID REFERENCES users(id),
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE platform_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  scope_tenant_id UUID REFERENCES tenants(id),
  key TEXT NOT NULL,
  value JSONB NOT NULL,
  updated_by UUID REFERENCES users(id),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (scope_tenant_id, key)
);
