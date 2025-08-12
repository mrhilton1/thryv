-- Check what's actually in the navigation_config table
SELECT * FROM navigation_config ORDER BY order_index;

-- If the table is empty, populate it with the correct navigation items
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
  (gen_random_uuid(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
  (gen_random_uuid(), 'executive_summary', 'Executive Summary', true, 3, NOW(), NOW()),
  (gen_random_uuid(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
  (gen_random_uuid(), 'admin', 'Admin', true, 5, NOW(), NOW())
ON CONFLICT (item_key) DO UPDATE SET
  item_label = EXCLUDED.item_label,
  is_visible = EXCLUDED.is_visible,
  order_index = EXCLUDED.order_index,
  updated_at = NOW();
