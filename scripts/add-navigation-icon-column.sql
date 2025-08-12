-- Migration: Add icon column to navigation_settings table
-- This adds support for icons in navigation items

ALTER TABLE navigation_settings 
ADD COLUMN IF NOT EXISTS icon TEXT DEFAULT 'Circle';

-- Update existing navigation items with appropriate default icons
UPDATE navigation_settings 
SET icon = CASE 
    WHEN item_key = 'dashboard' THEN 'LayoutDashboard'
    WHEN item_key = 'initiatives' THEN 'Target'
    WHEN item_key = 'calendar' THEN 'Calendar'
    WHEN item_key = 'achievements' THEN 'Trophy'
    WHEN item_key = 'reports' THEN 'FileText'
    WHEN item_key = 'admin' THEN 'Settings'
    ELSE 'Circle'
END
WHERE icon IS NULL OR icon = 'Circle';

-- Add a comment to document the column
COMMENT ON COLUMN navigation_settings.icon IS 'Lucide React icon name for navigation item display';
