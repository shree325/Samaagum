-- Migration: Add missing fields to users and profiles tables to sync with Prisma schema

-- Update users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image_data BYTEA;
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);

-- Update profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS skills JSONB DEFAULT '[]'::jsonb;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS gender VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS dob DATE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS cover_image_data BYTEA;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS profile_image_data BYTEA;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS first_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone_number VARCHAR(20);
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS user_name TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS headline TEXT;
