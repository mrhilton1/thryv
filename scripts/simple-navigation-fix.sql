-- Clear and repopulate navigation items without ON CONFLICT
DELETE FROM navigation_config;

-- Insert the correct navigation items
INSERT INTO navigation_config (item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
('dashboard', 'Dashboard', true, 1, NOW(), NOW()),
('initiatives', 'Initiatives', true, 2, NOW(), NOW()),
('executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
('calendar', 'Calendar', true, 4, NOW(), NOW()),
('admin', 'Admin', true, 5, NOW(), NOW());

-- Check what was inserted
SELECT * FROM navigation_config ORDER BY order_index;
