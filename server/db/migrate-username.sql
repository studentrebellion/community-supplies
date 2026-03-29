-- Migration: Switch from email-based auth to username-based auth
-- Adds username and signal_contact fields, makes email optional

-- Add username column
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS username TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS signal_contact TEXT;

-- Make email nullable (no longer required)
ALTER TABLE profiles ALTER COLUMN email DROP NOT NULL;

-- Set default usernames for existing rows (use email prefix as fallback)
UPDATE profiles SET username = SPLIT_PART(email, '@', 1) WHERE username IS NULL;

-- Now make username NOT NULL and UNIQUE
ALTER TABLE profiles ALTER COLUMN username SET NOT NULL;

-- Add unique constraint on username (if not exists)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'profiles_username_key') THEN
    ALTER TABLE profiles ADD CONSTRAINT profiles_username_key UNIQUE (username);
  END IF;
END $$;

-- Add index on username
CREATE INDEX IF NOT EXISTS idx_profiles_username ON profiles(username);

-- Drop magic link tokens table (no longer needed)
DROP TABLE IF EXISTS magic_link_tokens;
