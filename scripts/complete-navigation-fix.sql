-- COMPLETE NAVIGATION FIX
-- This script will properly set up the navigation_config table to match the app's expectations

-- First, let's see what we currently have
SELECT 'Current navigation_config data:' as info;
SELECT * FROM navigation_config;

-- Drop and recreate the navigation_config table with the correct schema
DROP TABLE IF EXISTS navigation_config CASCADE;

CREATE TABLE navigation_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    item_key TEXT NOT NULL,
    item_label TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insert the actual navigation items that match the app
INSERT INTO navigation_config (item_key, item_label, is_visible, order_index) VALUES
('dashboard', 'Dashboard', true, 1),
('initiatives', 'Initiatives', true, 2),
('executive-summary', 'Executive Summary', true, 3),
('calendar', 'Calendar', true, 4),
('admin', 'Admin', true, 5);

-- Enable RLS
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies
CREATE POLICY "Allow authenticated users to read navigation_config" ON navigation_config
    FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to update navigation_config" ON navigation_config
    FOR UPDATE TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to insert navigation_config" ON navigation_config
    FOR INSERT TO authenticated WITH CHECK (true);

CREATE POLICY "Allow authenticated users to delete navigation_config" ON navigation_config
    FOR DELETE TO authenticated USING (true);

-- Verify the data
SELECT 'Final navigation_config data:' as info;
SELECT * FROM navigation_config ORDER BY order_index;
