-- proxies.sql
-- SQL schema for the proxies table in Supabase

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create the proxies table
CREATE TABLE proxies (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  host TEXT NOT NULL,
  port INTEGER NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('http', 'https', 'socks4', 'socks5')),
  username TEXT,
  -- Note: password is not stored in the database for security reasons
  -- Passwords should be stored securely on the server or in a secure credential store
  status TEXT DEFAULT 'pending',
  failure_count INTEGER DEFAULT 0,
  success_count INTEGER DEFAULT 0,
  average_response_time FLOAT DEFAULT 0,
  assigned_profiles TEXT[] DEFAULT '{}',
  geolocation JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_proxies_status ON proxies(status);
CREATE INDEX idx_proxies_protocol ON proxies(protocol);
CREATE INDEX idx_proxies_host_port ON proxies(host, port);

-- Create a function to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to call the function whenever a row is updated
CREATE TRIGGER update_proxies_updated_at
BEFORE UPDATE ON proxies
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Create RLS (Row Level Security) policies
-- This assumes you have authentication set up in Supabase
ALTER TABLE proxies ENABLE ROW LEVEL SECURITY;

-- Add user_id column to track ownership
ALTER TABLE proxies ADD COLUMN user_id UUID REFERENCES auth.users(id);

-- Create index on user_id
CREATE INDEX idx_proxies_user_id ON proxies(user_id);

-- Allow authenticated users to select their own proxies
CREATE POLICY "Users can view their own proxies"
  ON proxies FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own proxies
CREATE POLICY "Users can insert their own proxies"
  ON proxies FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own proxies
CREATE POLICY "Users can update their own proxies"
  ON proxies FOR UPDATE
  USING (auth.uid() = user_id);

-- Allow authenticated users to delete their own proxies
CREATE POLICY "Users can delete their own proxies"
  ON proxies FOR DELETE
  USING (auth.uid() = user_id);

-- Security: Ensure the user_id is always set to the authenticated user
CREATE OR REPLACE FUNCTION set_proxy_user_id_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  NEW.user_id = auth.uid();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create a trigger to automatically set user_id on insert
CREATE TRIGGER ensure_proxy_user_id
BEFORE INSERT ON proxies
FOR EACH ROW
EXECUTE FUNCTION set_proxy_user_id_on_insert();

-- Add comments to the table and columns for better documentation
COMMENT ON TABLE proxies IS 'Stores proxy server configurations for browser profiles';
COMMENT ON COLUMN proxies.id IS 'Unique identifier for the proxy';
COMMENT ON COLUMN proxies.host IS 'Hostname or IP address of the proxy server';
COMMENT ON COLUMN proxies.port IS 'Port number of the proxy server';
COMMENT ON COLUMN proxies.protocol IS 'Protocol used by the proxy (http, https, socks4, socks5)';
COMMENT ON COLUMN proxies.username IS 'Username for authenticated proxies';
COMMENT ON COLUMN proxies.status IS 'Current status of the proxy (pending, active, inactive, etc.)';
COMMENT ON COLUMN proxies.failure_count IS 'Number of failed connection attempts';
COMMENT ON COLUMN proxies.success_count IS 'Number of successful connection attempts';
COMMENT ON COLUMN proxies.average_response_time IS 'Average response time in milliseconds';
COMMENT ON COLUMN proxies.assigned_profiles IS 'Array of profile IDs that use this proxy';
COMMENT ON COLUMN proxies.geolocation IS 'JSON object containing geolocation data for the proxy';
COMMENT ON COLUMN proxies.created_at IS 'Timestamp when the proxy was created';
COMMENT ON COLUMN proxies.updated_at IS 'Timestamp when the proxy was last updated';
COMMENT ON COLUMN proxies.user_id IS 'User ID who owns this proxy (enforced by RLS)';
