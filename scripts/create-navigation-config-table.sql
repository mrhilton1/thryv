-- Create navigation_config table (avoiding reserved keywords)
CREATE TABLE IF NOT EXISTS navigation_config (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    item_key VARCHAR(50) NOT NULL UNIQUE,
    item_label VARCHAR(100) NOT NULL,
    item_icon VARCHAR(50),
    item_route VARCHAR(200),
    item_description TEXT,
    is_visible BOOLEAN DEFAULT true,
    is_custom BOOLEAN DEFAULT false,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_navigation_config_sort_order ON navigation_config(sort_order);
CREATE INDEX IF NOT EXISTS idx_navigation_config_visible ON navigation_config(is_visible);

-- Enable RLS
ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Allow read access to navigation_config" ON navigation_config
    FOR SELECT USING (true);

CREATE POLICY "Allow insert access to navigation_config" ON navigation_config
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Allow update access to navigation_config" ON navigation_config
    FOR UPDATE USING (true);

CREATE POLICY "Allow delete access to navigation_config" ON navigation_config
    FOR DELETE USING (true);

-- Insert default navigation items (avoiding reserved keywords)
INSERT INTO navigation_config (item_key, item_label, item_icon, item_route, item_description, is_visible, is_custom, sort_order)
VALUES 
    ('dashboard', 'Dashboard', 'LayoutDashboard', '/', 'Main dashboard overview', true, false, 1),
    ('initiatives', 'Initiatives', 'Target', '/initiatives', 'Manage and track initiatives', true, false, 2),
    ('executive-summary', 'Executive Summary', 'FileText', '/executive-summary', 'Executive summary and reports', true, false, 3),
    ('calendar', 'Calendar', 'Calendar', '/calendar', 'Calendar view of events and milestones', true, false, 4),
    ('admin', 'Admin', 'Settings', '/admin', 'Administrative settings and configuration', true, false, 5)
ON CONFLICT (item_key) DO UPDATE SET
    item_label = EXCLUDED.item_label,
    item_icon = EXCLUDED.item_icon,
    item_route = EXCLUDED.item_route,
    item_description = EXCLUDED.item_description,
    sort_order = EXCLUDED.sort_order,
    updated_at = NOW();
