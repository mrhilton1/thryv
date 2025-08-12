-- Fix navigation items to match the exact names expected by the app
-- This ensures proper linking between database items and app functionality

-- Clear existing navigation items
DELETE FROM navigation_config;

-- Insert navigation items with exact names that match the app's nameToTabMap
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, icon, route, created_at, updated_at) VALUES
(gen_random_uuid(), 'dashboard', 'Dashboard', true, 0, 'BarChart3', '/dashboard', NOW(), NOW()),
(gen_random_uuid(), 'initiatives', 'Initiatives', true, 1, 'Target', '/initiatives', NOW(), NOW()),
(gen_random_uuid(), 'executive-summary', 'Executive Summary', true, 2, 'FileText', '/summary', NOW(), NOW()),
(gen_random_uuid(), 'calendar', 'Calendar', true, 3, 'Calendar', '/calendar', NOW(), NOW()),
(gen_random_uuid(), 'admin', 'Admin', true, 4, 'Settings', '/admin', NOW(), NOW());

-- Verify the data
SELECT item_key, item_label, is_visible, order_index, icon FROM navigation_config ORDER BY order_index;
