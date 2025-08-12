-- Safe migration that handles existing tables
-- Drop existing tables if they exist and recreate them properly

-- Drop existing tables (this will also drop their data, so be careful)
DROP TABLE IF EXISTS navigation_config CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;

-- Create navigation_config table with correct structure
CREATE TABLE navigation_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_key TEXT NOT NULL UNIQUE,
    item_label TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create profiles table with correct structure  
CREATE TABLE profiles (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    profile_id UUID,
    avatar TEXT,
    is_active BOOLEAN DEFAULT true
);

-- Copy data from original tables if they exist
DO $$
BEGIN
    -- Copy navigation data
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'navigation_settings') THEN
        INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
        SELECT id, item_key, item_label, is_visible, sort_order, created_at, updated_at
        FROM navigation_settings;
    END IF;
    
    -- Copy user data  
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'users') THEN
        INSERT INTO profiles (id, name, email, role, created_at, updated_at, profile_id, avatar, is_active)
        SELECT id, name, email, role, created_at, updated_at, profile_id, avatar, is_active
        FROM users;
    END IF;
END $$;

-- Insert default navigation items if table is empty
INSERT INTO navigation_config (item_key, item_label, is_visible, order_index) VALUES
('dashboard', 'Dashboard', true, 1),
('initiatives', 'Initiatives', true, 2),
('executive-summary', 'Executive Summary', true, 3),
('calendar', 'Calendar', true, 4),
('admin', 'Admin', true, 5)
ON CONFLICT (item_key) DO NOTHING;

-- Enable RLS
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Allow all operations for authenticated users" ON navigation_config FOR ALL USING (true);
CREATE POLICY "Allow all operations for authenticated users" ON profiles FOR ALL USING (true);

-- Create indexes
CREATE INDEX idx_navigation_config_order ON navigation_config(order_index);
CREATE INDEX idx_profiles_email ON profiles(email);
