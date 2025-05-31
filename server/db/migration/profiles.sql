-- profiles.sql
-- SQL schema for the profiles table in Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the profiles table
CREATE TABLE profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT 'inactive',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Profile configuration stored as JSONB
  -- Note: Sensitive data like cookies should be stored on the server, not in the database
  config JSONB NOT NULL DEFAULT '{
    "browser": "chrome",
    "os": "windows",
    "resolution": {"width": 1920, "height": 1080},
    "timezone": null,
    "locale": null,
    "proxy": null,
    "cookies_enabled": true,
    "storage_enabled": true
  }',

  -- Fingerprint data stored as JSONB
  fingerprint JSONB NOT NULL DEFAULT '{
    "navigator": {},
    "screen": {},
    "webgl": {},
    "canvas": {},
    "audio": {},
    "fonts": []
  }',

  -- Session data
  session_id TEXT,
  last_launched TIMESTAMP WITH TIME ZONE,
  launch_count INTEGER DEFAULT 0,
  total_usage_time INTEGER DEFAULT 0,

  -- User who owns this profile
  user_id UUID
);

-- Create indexes for better performance
CREATE INDEX idx_profiles_name ON profiles(name);
CREATE INDEX idx_profiles_status ON profiles(status);
CREATE INDEX idx_profiles_user_id ON profiles(user_id);
CREATE INDEX idx_profiles_config_browser ON profiles((config->>'browser'));
CREATE INDEX idx_profiles_config_os ON profiles((config->>'os'));
CREATE INDEX idx_profiles_session_id ON profiles(session_id);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function whenever a row is updated
CREATE TRIGGER update_profiles_updated_at
BEFORE UPDATE ON profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
-- This assumes you have authentication set up in Supabase
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to select their own profiles
CREATE POLICY "Users can view their own profiles"
  ON profiles FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own profiles
CREATE POLICY "Users can insert their own profiles"
  ON profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own profiles
CREATE POLICY "Users can update their own profiles"
  ON profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own profiles
CREATE POLICY "Users can delete their own profiles"
  ON profiles FOR DELETE
  USING (auth.uid() = user_id);

-- Security: Ensure the user_id is always set to the authenticated user
CREATE OR REPLACE FUNCTION set_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically set user_id on insert
CREATE TRIGGER ensure_profile_user_id
BEFORE INSERT ON profiles
FOR EACH ROW
EXECUTE FUNCTION set_user_id_on_insert();

-- Add comments to the table and columns for better documentation
COMMENT ON TABLE profiles IS 'Stores browser profiles for users';
COMMENT ON COLUMN profiles.id IS 'Unique identifier for the profile';
COMMENT ON COLUMN profiles.name IS 'Name of the profile';
COMMENT ON COLUMN profiles.description IS 'Optional description of the profile';
COMMENT ON COLUMN profiles.status IS 'Current status of the profile (active, inactive, etc.)';
COMMENT ON COLUMN profiles.created_at IS 'Timestamp when the profile was created';
COMMENT ON COLUMN profiles.updated_at IS 'Timestamp when the profile was last updated';
COMMENT ON COLUMN profiles.config IS 'JSON configuration for the browser profile';
COMMENT ON COLUMN profiles.fingerprint IS 'JSON fingerprint data for the browser profile';
COMMENT ON COLUMN profiles.session_id IS 'Current session ID if the profile is active';
COMMENT ON COLUMN profiles.last_launched IS 'Timestamp when the profile was last launched';
COMMENT ON COLUMN profiles.launch_count IS 'Number of times the profile has been launched';
COMMENT ON COLUMN profiles.total_usage_time IS 'Total usage time in seconds';
COMMENT ON COLUMN profiles.user_id IS 'User ID who owns this profile';

-- Create a view for active profiles
CREATE VIEW active_profiles AS
SELECT *
FROM profiles
WHERE status = 'active' AND session_id IS NOT NULL;

-- Create a function to update profile status when a session ends
CREATE OR REPLACE FUNCTION update_profile_on_session_end()
RETURNS TRIGGER AS $$
BEGIN
  -- If session_id is being set to NULL, update status to inactive
  IF OLD.session_id IS NOT NULL AND NEW.session_id IS NULL THEN
    NEW.status = 'inactive';
  END IF;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function when session_id is updated
CREATE TRIGGER update_profile_status_on_session_end
BEFORE UPDATE OF session_id ON profiles
FOR EACH ROW
WHEN (OLD.session_id IS NOT NULL AND NEW.session_id IS NULL)
EXECUTE FUNCTION update_profile_on_session_end();
