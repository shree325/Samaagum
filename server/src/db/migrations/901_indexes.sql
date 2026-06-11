-- =====================================================================
-- Migration 901: Indexes (FKs + hot lookups)
-- Phase: Post-all
-- =====================================================================

CREATE INDEX idx_users_tenant_id ON users (tenant_id);
CREATE INDEX idx_entities_tenant_id ON entities (tenant_id);
CREATE INDEX idx_entities_parent_entity_id ON entities (parent_entity_id);
CREATE INDEX idx_role_assignments_user_id ON role_assignments (user_id);
CREATE INDEX idx_role_assignments_scope_entity_id ON role_assignments (scope_entity_id);
CREATE INDEX idx_group_memberships_group_id ON group_memberships (group_id);
CREATE INDEX idx_group_memberships_user_id ON group_memberships (user_id);
CREATE INDEX idx_events_hosted_by_entity_id ON events (hosted_by_entity_id);
CREATE INDEX idx_events_status ON events (status);
CREATE INDEX idx_ticket_types_event_id ON ticket_types (event_id);
CREATE INDEX idx_bookings_event_id ON bookings (event_id);
CREATE INDEX idx_bookings_booker_user_id ON bookings (booker_user_id);
CREATE INDEX idx_bookings_status ON bookings (status);
CREATE INDEX idx_booking_line_items_booking_id ON booking_line_items (booking_id);
CREATE INDEX idx_tickets_line_item_id ON tickets (line_item_id);
CREATE INDEX idx_tickets_qr_token ON tickets (qr_token);
CREATE INDEX idx_checkins_ticket_id ON checkins (ticket_id);
CREATE INDEX idx_payments_booking_id ON payments (booking_id);
CREATE INDEX idx_ledger_lines_journal_id ON ledger_lines (journal_id);
CREATE INDEX idx_ledger_lines_account_id ON ledger_lines (account_id);
CREATE INDEX idx_coupon_redemptions_coupon_id ON coupon_redemptions (coupon_id);
CREATE INDEX idx_forum_posts_scope_id ON forum_posts (scope_id);
CREATE INDEX idx_messages_conversation_id ON messages (conversation_id);
CREATE INDEX idx_connections_addressee_user_id ON connections (addressee_user_id);
CREATE INDEX idx_wishlists_event_id ON wishlists (event_id);
CREATE INDEX idx_domain_events_aggregate_id ON domain_events (aggregate_id);
CREATE INDEX idx_domain_events_published_at ON domain_events (published_at);
CREATE INDEX idx_audit_log_target_id ON audit_log (target_id);
CREATE INDEX idx_signals_subject_id ON signals (subject_id);
CREATE INDEX idx_subscriptions_owner_entity_id ON subscriptions (owner_entity_id);
