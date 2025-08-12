-- Fix duplicate Executive Summary entries and synchronize icons
-- This script removes duplicates and ensures consistent icons

-- First, let's see what we have
SELECT id, item_key, item_label, icon, sort_order FROM navigation_settings ORDER BY sort_order;

-- Remove the duplicate 'summary' entry (keep 'executive-summary')
DELETE FROM navigation_settings 
WHERE item_key = 'summary' 
AND EXISTS (
    SELECT 1 FROM navigation_settings 
    WHERE item_key = 'executive-summary'
);

-- Update icons to match the expected mapping from dashboard layout
UPDATE navigation_settings SET icon = 'BarChart3' WHERE item_key = 'dashboard';
UPDATE navigation_settings SET icon = 'FileText' WHERE item_key = 'executive-summary';
UPDATE navigation_settings SET icon = 'Target' WHERE item_key = 'initiatives';
UPDATE navigation_settings SET icon = 'Calendar' WHERE item_key = 'calendar';
UPDATE navigation_settings SET icon = 'Settings' WHERE item_key = 'admin';

-- Ensure proper sort order
UPDATE navigation_settings SET sort_order = 1 WHERE item_key = 'dashboard';
UPDATE navigation_settings SET sort_order = 2 WHERE item_key = 'executive-summary';
UPDATE navigation_settings SET sort_order = 3 WHERE item_key = 'initiatives';
UPDATE navigation_settings SET sort_order = 4 WHERE item_key = 'calendar';
UPDATE navigation_settings SET sort_order = 5 WHERE item_key = 'admin';

-- Verify the results
SELECT id, item_key, item_label, icon, sort_order, is_visible FROM navigation_settings ORDER BY sort_order;
