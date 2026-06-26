-- Migration: Create message_receipts table
CREATE TABLE IF NOT EXISTS message_receipts (
  message_id UUID NOT NULL REFERENCES messages(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  delivered_at TIMESTAMP WITH TIME ZONE,
  seen_at TIMESTAMP WITH TIME ZONE,
  PRIMARY KEY (message_id, user_id)
);
