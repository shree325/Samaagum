-- Migration: Add missing fields to users and conversations tables to sync with Prisma schema
-- Target: users (last_seen_at)
-- Target: conversations (title, archived_at, last_activity_at, dm_key, last_message_id, request_expires_at)

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ;

-- Update conversations table
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS title TEXT;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_activity_at TIMESTAMPTZ DEFAULT now();
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS dm_key VARCHAR(100) UNIQUE;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS last_message_id UUID;
ALTER TABLE conversations ADD COLUMN IF NOT EXISTS request_expires_at TIMESTAMPTZ;

-- Add index on last_activity_at
CREATE INDEX IF NOT EXISTS idx_conversations_last_activity_at ON conversations(last_activity_at);
