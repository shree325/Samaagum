-- =====================================================================
-- Migration 902: Row-Level Security (multi-tenancy isolation)
-- Phase: Post-all
-- App sets per-request: SET app.tenant_id = '<uuid>';
-- =====================================================================

DO $$ DECLARE t TEXT; BEGIN
  FOREACH t IN ARRAY ARRAY[
    'users','auth_identities','user_consents','profiles','profile_links',
    
    'entities','group_memberships',
    'collaboration_members',
    'role_assignments','subscriptions',
    'membership_tiers','membership_subscriptions',
    'forms','form_responses',
    'events','ticket_types','event_team_assignments',
    'bundles','addons',
    'bookings','booking_line_items','tickets','ticket_claims','checkins',
    'waitlist_entries',
    'payments','refunds','ledger_accounts','ledger_journals',
    'settlements','coupons','coupon_redemptions',
    'media_assets','galleries',
    'forum_posts','forum_comments','wishlists','reviews','ratings',
    'connections','conversations','messages',
    'entity_pages','follows',
    'affiliates','referral_links','referral_clicks',
    'affiliate_commissions','affiliate_payouts',
    'sponsors','sponsorship_packages','sponsorship_orders',
    'takeover_requests',
    'domain_events','audit_log','idempotency_keys','notification_log',
    'signals','impersonation_sessions',
    'marketplace_listings','marketplace_bids',
    'api_clients',
    'moderation_reports','kyc_submissions','kyc_reviews',
    'support_cases','disputes'
  ] LOOP
    EXECUTE format('ALTER TABLE %I ENABLE ROW LEVEL SECURITY;', t);
    EXECUTE format(
      'CREATE POLICY tenant_isolation ON %I USING (tenant_id = current_setting(''app.tenant_id'', true)::uuid);',
      t
    );
  END LOOP;
END $$;
