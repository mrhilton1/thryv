-- Check what's actually in the navigation_config table
SELECT 
  id,
  item_key,
  item_label,
  is_visible,
  order_index,
  created_at
FROM navigation_config 
ORDER BY order_index;

-- Clear existing data and insert correct navigation items
DELETE FROM navigation_config;

INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
  (gen_random_uuid(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
  (gen_random_uuid(), 'executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
  (gen_random_uuid(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
  (gen_random_uuid(), 'admin', 'Admin', true, 5, NOW(), NOW());

-- Verify the data was inserted correctly
SELECT 
  id,
  item_key,
  item_label,
  is_visible,
  order_index
FROM navigation_config 
ORDER BY order_index;
