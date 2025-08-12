-- Restore essential navigation items that were accidentally removed
DELETE FROM navigation_settings;

INSERT INTO navigation_settings (id, item_key, item_label, is_visible, sort_order, created_at, updated_at) VALUES
(gen_random_uuid(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
(gen_random_uuid(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
(gen_random_uuid(), 'executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
(gen_random_uuid(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
(gen_random_uuid(), 'admin', 'Admin', true, 5, NOW(), NOW());
