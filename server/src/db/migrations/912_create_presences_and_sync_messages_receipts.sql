-- Migration: Create presences, reactions, message_versions, message_visibilities and sync messages/message_receipts tables with Prisma schema

-- Create Custom Enums if they do not exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageStatus') THEN
    CREATE TYPE "MessageStatus" AS ENUM ('ACTIVE', 'DELETED', 'MODERATED', 'HIDDEN');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MessageType') THEN
    CREATE TYPE "MessageType" AS ENUM ('TEXT', 'SYSTEM');
  END IF;
END$$;

-- Update messages table with missing columns
ALTER TABLE messages ADD COLUMN IF NOT EXISTS edited_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS reply_to_message_id UUID REFERENCES messages(id);
ALTER TABLE messages ADD COLUMN IF NOT EXISTS attachments_count INTEGER DEFAULT 0;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS deleted_for_everyone BOOLEAN DEFAULT false;
ALTER TABLE messages ADD COLUMN IF NOT EXISTS status "MessageStatus" DEFAULT 'ACTIVE';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS type "MessageType" DEFAULT 'TEXT';
ALTER TABLE messages ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 1;

-- Create presences table
CREATE TABLE IF NOT EXISTS presences (
  user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  status VARCHAR(32) NOT NULL DEFAULT 'OFFLINE',
  active_connections INTEGER NOT NULL DEFAULT 0,
  last_seen_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Re-create or alter message_receipts table to sync with Prisma
-- Drop composite primary key if exists
ALTER TABLE message_receipts DROP CONSTRAINT IF EXISTS message_receipts_pkey;

-- Add id column if not exists
ALTER TABLE message_receipts ADD COLUMN IF NOT EXISTS id UUID DEFAULT gen_random_uuid();

-- Make id the primary key
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'message_receipts'::regclass AND contype = 'p'
  ) THEN
    ALTER TABLE message_receipts ADD PRIMARY KEY (id);
  END IF;
END$$;

-- Add failed_at column
ALTER TABLE message_receipts ADD COLUMN IF NOT EXISTS failed_at TIMESTAMPTZ;

-- Drop unique constraint and index if they exist to prevent conflicts, then recreate
ALTER TABLE message_receipts DROP CONSTRAINT IF EXISTS message_receipts_message_id_user_id_key;
DROP INDEX IF EXISTS message_receipts_message_id_user_id_key;
ALTER TABLE message_receipts ADD CONSTRAINT message_receipts_message_id_user_id_key UNIQUE (message_id, user_id);

-- Create reactions table
CREATE TABLE IF NOT EXISTS reactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  emoji VARCHAR(32) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_versions table
CREATE TABLE IF NOT EXISTS message_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  version INTEGER NOT NULL,
  body TEXT NOT NULL,
  edited_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create message_visibilities table
CREATE TABLE IF NOT EXISTS message_visibilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  visible_at TIMESTAMPTZ,
  hidden_at TIMESTAMPTZ
);
