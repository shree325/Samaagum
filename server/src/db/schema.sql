BEGIN;

\i bootstrap.sql

-- ===== 1. Tenancy =====
\i tenants.sql

-- ===== 2. Identity & Profiles =====
\i users.sql
\i auth_identities.sql
\i user_consents.sql
\i categories.sql
\i user_profiles.sql
\i user_profile_links.sql
\i user_interest.sql
\i profile_requirements.sql
\i user_profile_requirment_status.sql

-- ===== 3. Entity Registry =====
\i entities.sql
\i orgs.sql
\i communities.sql
\i groups.sql
\i group_memberships.sql
\i collaborations.sql
\i collaboration_members.sql

-- ===== 4. RBAC =====
\i roles.sql
\i role_assignments.sql

-- ===== 5. Subscriptions & Entitlements =====
\i plans.sql
\i subscriptions.sql
\i feature_flags.sql
\i membership_tiers.sql
\i membership_subscriptions.sql

-- ===== 6. Form Builder =====
\i forms.sql
\i form_fields.sql
\i form_response.sql
\i form_response_values.sql
-- Note: forms.sql contains deferred FKs for groups.join_form_id and group_memberships.form_response_id

-- ===== 7. Events & Ticketing =====
\i events.sql
-- Note: events.sql contains deferred FK for collaborations.primary_event_id
\i ticket_types.sql
\i event_team_assignments.sql
\i bundles.sql
\i bundle_items.sql
\i addons.sql

-- ===== 8. Booking, Tickets & Check-in =====
\i bookings.sql
\i booking_line_items.sql
\i tickets.sql
\i ticket_claims.sql
\i checkins.sql
\i waitlist_entries.sql

-- ===== 9. Payments & Ledger =====
\i payments.sql
-- Note: payments.sql contains deferred FK for waitlist_entries.hold_payment_id
\i refunds.sql
\i ledger_accounts.sql
\i ledger_journals.sql
\i ledger_lines.sql
\i settlements.sql
\i settlement_lines.sql
\i coupons.sql
\i coupon_redemptions.sql

-- ===== 10. Media & Community Content =====
\i media_assets.sql
-- Note: media_assets.sql contains deferred FKs for profiles and payments photo/proof columns
\i galleries.sql
\i gallery_media.sql
\i forum_post.sql
\i forum_comments.sql
\i wishlists.sql
\i reviews.sql
\i ratings.sql

-- ===== 11. Messaging & Social =====
\i connections.sql
\i conversations.sql
\i conversation_participation.sql
\i messages.sql
\i entity_pages.sql
\i follows.sql

-- ===== 12. Commercial =====
\i affiliates.sql
\i referral_links.sql
\i referral_clicks.sql
\i commissions.sql
\i affiliate_payouts.sql
\i sponsors.sql
\i sponsorship_packages.sql
\i sponsorship_orders.sql
\i takeover_requests.sql

-- ===== 13. Platform Services & Audit =====
\i domain_events.sql
\i audit_log.sql
\i idempotency_keys.sql
\i notification_log.sql
\i signals.sql
\i impersonation_sessions.sql

-- ===== 14. Phase-2 Provisional =====
\i marketplace_listings.sql
\i marketplace_bids.sql
\i badges.sql
\i user_badges.sql
\i api_clients.sql
\i api_keys.sql
\i outbound_webhooks.sql

-- ===== 13b. Admin & Operations =====
\i moderation_reports.sql
\i kyc_submissions.sql
\i kyc_reviews.sql
\i support_cases.sql
\i disputes.sql
\i platform_settings.sql

COMMIT;
