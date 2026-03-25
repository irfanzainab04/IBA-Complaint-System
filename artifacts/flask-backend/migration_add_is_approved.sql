-- Run this migration in your Supabase SQL Editor
-- https://supabase.com/dashboard/project/dlzhnyevdoydnlcjzxtk/sql/new

-- Add is_approved column to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_approved BOOLEAN NOT NULL DEFAULT TRUE;

-- All existing users are already approved
UPDATE users SET is_approved = TRUE WHERE is_approved IS NULL;
