-- =====================================================================
-- Migration 000: Extensions, Domains, Enums, Trigger Function
-- Phase: Bootstrap (required by all subsequent migrations)
-- =====================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;   -- gen_random_uuid()
CREATE EXTENSION IF NOT EXISTS citext;     -- case-insensitive text (for emails)

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
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;
