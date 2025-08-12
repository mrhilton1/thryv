-- Executive Dashboard Database Migration
-- Run this in your Supabase SQL Editor

-- First, run the base schema if tables don't exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table (will be renamed to profiles)
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'executive', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation settings table (will be renamed to navigation_config)
CREATE TABLE IF NOT EXISTS navigation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_key TEXT UNIQUE NOT NULL,
    item_label TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create profiles table (what the app expects)
CREATE TABLE IF NOT EXISTS profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'executive', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create navigation_config table (what the app expects)
CREATE TABLE IF NOT EXISTS navigation_config (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_key TEXT UNIQUE NOT NULL,
    item_label TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Copy data from users to profiles if users table has data
INSERT INTO profiles (id, name, email, role, created_at, updated_at)
SELECT id, name, email, role, created_at, updated_at FROM users
ON CONFLICT (id) DO NOTHING;

-- Copy data from navigation_settings to navigation_config if navigation_settings has data
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
SELECT id, item_key, item_label, is_visible, sort_order, created_at, updated_at FROM navigation_settings
ON CONFLICT (id) DO NOTHING;

-- Insert sample data if tables are empty
INSERT INTO profiles (name, email, role) VALUES
    ('John Doe', 'john@example.com', 'admin'),
    ('Jane Smith', 'jane@example.com', 'executive'),
    ('Bob Johnson', 'bob@example.com', 'manager'),
    ('Alice Wilson', 'alice@example.com', 'user')
ON CONFLICT (email) DO NOTHING;

-- Insert navigation config
INSERT INTO navigation_config (item_key, item_label, is_visible, order_index) VALUES
    ('dashboard', 'Dashboard', true, 1),
    ('initiatives', 'Initiatives', true, 2),
    ('calendar', 'Calendar', true, 3),
    ('achievements', 'Achievements', true, 4),
    ('reports', 'Reports', true, 5),
    ('admin', 'Admin', true, 6)
ON CONFLICT (item_key) DO NOTHING;

-- Enable Row Level Security but with permissive policies
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON profiles;
DROP POLICY IF EXISTS "Allow all operations" ON navigation_config;

-- Create permissive policies (allow all for now)
CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON navigation_config FOR ALL USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_navigation_config_visible ON navigation_config(is_visible, order_index);
