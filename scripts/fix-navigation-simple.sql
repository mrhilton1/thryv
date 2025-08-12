-- Clear existing navigation items and insert correct ones
DELETE FROM navigation_config;

-- Insert navigation items with only existing columns
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
    (uuid_generate_v4(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
    (uuid_generate_v4(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
    (uuid_generate_v4(), 'executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
    (uuid_generate_v4(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
    (uuid_generate_v4(), 'admin', 'Admin', true, 5, NOW(), NOW());
