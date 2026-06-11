-- =====================================================================
-- Samaagum  |  Table: media_assets
-- Synced from schema_v2.sql  (v2.0 | June 2026)
-- =====================================================================

DROP TABLE IF EXISTS media_assets CASCADE;

CREATE TABLE media_assets (
  -- phase: MVP-0 | File/image/video asset stored in object storage
  id              UUID              PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id       UUID              NOT NULL REFERENCES tenants(id),
  owner_entity_id UUID              REFERENCES entities(id),
  owner_user_id   UUID              REFERENCES users(id),
  storage_key     TEXT              NOT NULL,
  mime            TEXT,
  visibility      visibility_level  NOT NULL DEFAULT 'public',
  created_at      timestamptz       NOT NULL DEFAULT now(),
  updated_at      timestamptz       NOT NULL DEFAULT now()
);


-- Deferred: enforce profile photo/cover and payment proof FKs (media_assets created after profiles/payments)
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_photo FOREIGN KEY (photo_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD CONSTRAINT fk_profiles_cover FOREIGN KEY (cover_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;
ALTER TABLE payments ADD CONSTRAINT fk_payments_proof FOREIGN KEY (proof_asset_id) REFERENCES media_assets(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX idx_media_assets_tenant_id ON media_assets (tenant_id);

-- Row-Level Security
ALTER TABLE media_assets ENABLE ROW LEVEL SECURITY;
CREATE POLICY tenant_isolation ON media_assets
  USING (tenant_id = current_setting('app.tenant_id', true)::uuid);

-- updated_at trigger
DROP TRIGGER IF EXISTS trg_media_assets_updated ON media_assets;
CREATE TRIGGER trg_media_assets_updated
  BEFORE UPDATE ON media_assets
  FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMENT ON TABLE media_assets              IS 'phase:MVP-0';
