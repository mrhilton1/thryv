-- Clear existing navigation config and populate with actual navigation items
DELETE FROM navigation_config;

-- Insert the actual navigation items that match your sidebar
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
  (gen_random_uuid(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
  (gen_random_uuid(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
  (gen_random_uuid(), 'executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
  (gen_random_uuid(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
  (gen_random_uuid(), 'admin', 'Admin', true, 5, NOW(), NOW());

-- Verify the data was inserted
SELECT item_key, item_label, is_visible, order_index FROM navigation_config ORDER BY order_index;
