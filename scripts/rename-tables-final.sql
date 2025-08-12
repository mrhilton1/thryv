-- Migration to rename tables to match application expectations
-- Run this in your Supabase SQL Editor

-- First, disable RLS temporarily to avoid conflicts
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings DISABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON navigation_settings;

-- Rename users table to profiles
ALTER TABLE users RENAME TO profiles;

-- Rename navigation_settings to navigation_config and sort_order to order_index
ALTER TABLE navigation_settings RENAME TO navigation_config;
ALTER TABLE navigation_config RENAME COLUMN sort_order TO order_index;

-- Update foreign key constraints to reference profiles instead of users
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_owner_id_fkey;
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_created_by_id_fkey;
ALTER TABLE notes DROP CONSTRAINT IF EXISTS notes_created_by_id_fkey;
ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_created_by_id_fkey;
ALTER TABLE executive_summaries DROP CONSTRAINT IF EXISTS executive_summaries_created_by_id_fkey;

-- Add new foreign key constraints referencing profiles
ALTER TABLE initiatives ADD CONSTRAINT initiatives_owner_id_fkey 
    FOREIGN KEY (owner_id) REFERENCES profiles(id);
ALTER TABLE initiatives ADD CONSTRAINT initiatives_created_by_id_fkey 
    FOREIGN KEY (created_by_id) REFERENCES profiles(id);
ALTER TABLE notes ADD CONSTRAINT notes_created_by_id_fkey 
    FOREIGN KEY (created_by_id) REFERENCES profiles(id);
ALTER TABLE achievements ADD CONSTRAINT achievements_created_by_id_fkey 
    FOREIGN KEY (created_by_id) REFERENCES profiles(id);
ALTER TABLE executive_summaries ADD CONSTRAINT executive_summaries_created_by_id_fkey 
    FOREIGN KEY (created_by_id) REFERENCES profiles(id);

-- Re-enable RLS and create simple policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- Create simple policies that allow all operations (you can restrict later)
CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON navigation_config FOR ALL USING (true);

-- Update triggers to use new table names
DROP TRIGGER IF EXISTS update_users_updated_at ON profiles;
DROP TRIGGER IF EXISTS update_navigation_settings_updated_at ON navigation_config;

CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_config_updated_at BEFORE UPDATE ON navigation_config
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Update indexes
DROP INDEX IF EXISTS idx_navigation_settings_visible;
CREATE INDEX IF NOT EXISTS idx_navigation_config_visible ON navigation_config(is_visible, order_index);
