-- =====================================================================
-- Migration 900: Deferred Foreign Keys (forward references)
-- Phase: Post-all (run after all table creation migrations)
-- =====================================================================

ALTER TABLE groups
  ADD CONSTRAINT fk_groups_join_form
  FOREIGN KEY (join_form_id) REFERENCES forms(id);

ALTER TABLE group_memberships
  ADD CONSTRAINT fk_gm_form_response
  FOREIGN KEY (form_response_id) REFERENCES form_responses(id);

ALTER TABLE collaborations
  ADD CONSTRAINT fk_collab_primary_event
  FOREIGN KEY (primary_event_id) REFERENCES events(id);

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_photo
  FOREIGN KEY (photo_asset_id) REFERENCES media_assets(id);

ALTER TABLE profiles
  ADD CONSTRAINT fk_profiles_cover
  FOREIGN KEY (cover_asset_id) REFERENCES media_assets(id);

ALTER TABLE payments
  ADD CONSTRAINT fk_payments_proof
  FOREIGN KEY (proof_asset_id) REFERENCES media_assets(id);

ALTER TABLE waitlist_entries
  ADD CONSTRAINT fk_waitlist_payment
  FOREIGN KEY (hold_payment_id) REFERENCES payments(id);
