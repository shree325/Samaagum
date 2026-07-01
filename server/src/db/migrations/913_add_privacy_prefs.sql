-- Migration: Add privacy_prefs to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS privacy_prefs JSONB DEFAULT '{}';
