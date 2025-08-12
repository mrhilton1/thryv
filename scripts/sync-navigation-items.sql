-- Check current navigation_settings table data
SELECT 
  id,
  item_key,
  item_label,
  is_visible,
  sort_order,
  icon,
  created_at
FROM navigation_settings 
ORDER BY sort_order;

-- Insert missing navigation items if they don't exist
INSERT INTO navigation_settings (item_key, item_label, is_visible, sort_order, icon, created_at, updated_at) 
VALUES
  ('dashboard', 'Dashboard', true, 1, 'BarChart3', NOW(), NOW()),
  ('summary', 'Executive Summary', true, 2, 'FileText', NOW(), NOW()),
  ('initiatives', 'Initiatives', true, 3, 'Target', NOW(), NOW()),
  ('calendar', 'Calendar', true, 4, 'Calendar', NOW(), NOW()),
  ('admin', 'Admin', true, 5, 'Settings', NOW(), NOW())
ON CONFLICT (item_key) 
DO UPDATE SET 
  item_label = EXCLUDED.item_label,
  is_visible = EXCLUDED.is_visible,
  sort_order = EXCLUDED.sort_order,
  icon = EXCLUDED.icon,
  updated_at = NOW();

-- Verify all navigation items are now present
SELECT 
  id,
  item_key,
  item_label,
  is_visible,
  sort_order,
  icon
FROM navigation_settings 
ORDER BY sort_order;

-- Check for any duplicate or orphaned entries
SELECT item_key, COUNT(*) as count
FROM navigation_settings 
GROUP BY item_key
HAVING COUNT(*) > 1;
