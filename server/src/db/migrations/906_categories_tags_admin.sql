-- Alter categories table to add new admin columns if they don't exist
ALTER TABLE categories ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_type TEXT DEFAULT 'emoji';
ALTER TABLE categories ADD COLUMN IF NOT EXISTS icon_value TEXT;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS display_order INTEGER NOT NULL DEFAULT 999;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive'));
ALTER TABLE categories ADD COLUMN IF NOT EXISTS is_deleted BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE categories ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
ALTER TABLE categories ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

-- Create tags table if it doesn't exist
CREATE TABLE IF NOT EXISTS tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
    slug TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active','inactive')),
    is_deleted BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Seed initial categories
INSERT INTO categories (id, name, slug, description, icon_type, icon_value, display_order, status, is_deleted, created_at)
VALUES
  ('4cc218d6-444d-4e92-a169-52e46b04ccf1'::uuid, 'Technology', 'technology', 'Software, AI, hardware, and digital innovation events', 'emoji', '💻', 1, 'active', false, '2025-12-01T10:00:00Z'),
  ('c5d2c5e5-d72b-42ab-ba41-1188d3e91122'::uuid, 'Sports & Fitness', 'sports-fitness', 'Cricket, football, gym, running, and outdoor sports', 'emoji', '🏏', 2, 'active', false, '2025-12-01T10:01:00Z'),
  ('a82d02c8-89ab-48d8-9122-c3a44d18ccab'::uuid, 'Education', 'education', 'Workshops, seminars, training, and learning events', 'emoji', '🎓', 3, 'active', false, '2025-12-01T10:02:00Z'),
  ('fb8d120a-c211-4df2-acb1-a3f2b4e88d22'::uuid, 'Business & Startup', 'business-startup', 'Entrepreneurship, marketing, finance, and leadership', 'emoji', '🚀', 4, 'active', false, '2025-12-01T10:03:00Z'),
  ('b09d0a1b-312c-4912-88d4-5ea2b12da4f1'::uuid, 'Arts & Culture', 'arts-culture', 'Theatre, painting, photography, and cultural events', 'emoji', '🎨', 5, 'active', false, '2025-12-01T10:04:00Z'),
  ('e12d1b0d-da91-44ab-b561-12c8a3d881ab'::uuid, 'Music & Entertainment', 'music-entertainment', 'Live music, concerts, DJ nights, and performances', 'emoji', '🎵', 6, 'inactive', false, '2025-12-01T10:05:00Z'),
  ('d12c9b2f-ab01-44cd-9f12-a128e4ea7b21'::uuid, 'Travel & Adventure', 'travel-adventure', 'Trekking, road trips, and adventure meetups', 'emoji', '✈️', 7, 'active', false, '2025-12-01T10:06:00Z'),
  ('fa2c8b09-b4ab-4cd2-b6ab-1299c8ea0011'::uuid, 'Food & Dining', 'food-dining', 'Food festivals, cooking workshops, and dining events', 'emoji', '🍕', 8, 'active', false, '2025-12-01T10:07:00Z'),
  ('c3a9abf2-124b-4b1d-ad12-58eac2aa8f00'::uuid, 'Social & Networking', 'social-networking', 'Professional meetups, mixers, and community gatherings', 'emoji', '🤝', 9, 'active', false, '2025-12-01T10:08:00Z'),
  ('d09a8bf6-a4f2-49da-8bca-4ea0f29c2ab8'::uuid, 'Health & Wellness', 'health-wellness', 'Yoga, meditation, mental health, and wellness sessions', 'emoji', '🧘', 10, 'active', false, '2025-12-01T10:09:00Z')
ON CONFLICT (id) DO NOTHING;

-- Seed initial tags
INSERT INTO tags (id, name, slug, category_id, status, is_deleted, created_at)
VALUES
  ('a1b2c3d4-e5f6-7a8b-9c0d-1e2f3a4b5c6d'::uuid, 'Web3 & Crypto', 'web3-crypto', '4cc218d6-444d-4e92-a169-52e46b04ccf1'::uuid, 'active', false, '2026-01-01T10:00:00Z'),
  ('b2c3d4e5-f6a7-8b9c-0d1e-2f3a4b5c6d7e'::uuid, 'Yoga Flow', 'yoga-flow', 'd09a8bf6-a4f2-49da-8bca-4ea0f29c2ab8'::uuid, 'active', false, '2026-01-01T10:01:00Z'),
  ('c3d4e5f6-a7b8-9c0d-1e2f-3a4b5c6d7e8f'::uuid, 'SaaS & AI Startups', 'saas-ai-startups', 'fb8d120a-c211-4df2-acb1-a3f2b4e88d22'::uuid, 'active', false, '2026-01-01T10:02:00Z'),
  ('d4e5f6a7-b8c9-0d1e-2f3a-4b5c6d7e8f9a'::uuid, 'Generative AI', 'generative-ai', '4cc218d6-444d-4e92-a169-52e46b04ccf1'::uuid, 'active', false, '2026-01-01T10:03:00Z'),
  ('e5f6a7b8-c9d0-1e2f-3a4b-5c6d7e8f9a0b'::uuid, 'Indie Rock Concerts', 'indie-rock-concerts', 'e12d1b0d-da91-44ab-b561-12c8a3d881ab'::uuid, 'active', false, '2026-01-01T10:04:00Z'),
  ('f6a7b8c9-d0e1-2f3a-4b5c-6d7e8f9a0b1c'::uuid, 'Trekking & Hiking', 'trekking-hiking', 'd12c9b2f-ab01-44cd-9f12-a128e4ea7b21'::uuid, 'active', false, '2026-01-01T10:05:00Z'),
  ('a7b8c9d0-e1f2-3a4b-5c6d-7e8f9a0b1c2d'::uuid, 'UI/UX Design', 'ui-ux-design', 'b09d0a1b-312c-4912-88d4-5ea2b12da4f1'::uuid, 'active', false, '2026-01-01T10:06:00Z'),
  ('b8c9d0e1-f2a3-4b5c-6d7e-8f9a0b1c2d3e'::uuid, 'Fitness & Running', 'fitness-running', 'c5d2c5e5-d72b-42ab-ba41-1188d3e91122'::uuid, 'inactive', false, '2026-01-01T10:07:00Z')
ON CONFLICT (id) DO NOTHING;
