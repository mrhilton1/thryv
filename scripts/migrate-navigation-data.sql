-- Migrate data from navigation_settings to navigation_config and populate with default items
-- Clear navigation_config table first
DELETE FROM navigation_config;

-- Copy data from navigation_settings to navigation_config (mapping sort_order to order_index)
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
SELECT 
    id, 
    item_key, 
    item_label, 
    is_visible, 
    sort_order as order_index,  -- Map sort_order to order_index
    created_at, 
    updated_at
FROM navigation_settings
WHERE item_label IS NOT NULL AND item_label != '';

-- If no data was copied, insert default navigation items
INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
SELECT 
    gen_random_uuid(),
    item_key,
    item_label,
    is_visible,
    order_index,
    NOW(),
    NOW()
FROM (
    SELECT 'dashboard' as item_key, 'Dashboard' as item_label, true as is_visible, 1 as order_index
    UNION ALL
    SELECT 'initiatives' as item_key, 'Initiatives' as item_label, true as is_visible, 2 as order_index
    UNION ALL
    SELECT 'executive-summary' as item_key, 'Executive Summary' as item_label, true as is_visible, 3 as order_index
    UNION ALL
    SELECT 'calendar' as item_key, 'Calendar' as item_label, true as is_visible, 4 as order_index
    UNION ALL
    SELECT 'admin' as item_key, 'Admin' as item_label, true as is_visible, 5 as order_index
) default_items
WHERE NOT EXISTS (SELECT 1 FROM navigation_config);

-- Verify the data
SELECT 'Navigation Config Data:' as info;
SELECT item_key, item_label, is_visible, order_index FROM navigation_config ORDER BY order_index;
