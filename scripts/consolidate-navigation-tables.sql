-- Consolidate navigation data from navigation_settings to navigation_config
-- This fixes the issue where the app queries navigation_config but data is in navigation_settings

-- First, check if navigation_config has any data
DO $$
BEGIN
    -- Copy data from navigation_settings to navigation_config if navigation_config is empty
    IF NOT EXISTS (SELECT 1 FROM navigation_config LIMIT 1) THEN
        -- Copy existing data from navigation_settings to navigation_config
        INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
        SELECT 
            id,
            item_key,
            item_label,
            is_visible,
            sort_order as order_index, -- Map sort_order to order_index
            created_at,
            updated_at
        FROM navigation_settings
        WHERE navigation_settings.id IS NOT NULL;
        
        RAISE NOTICE 'Copied % rows from navigation_settings to navigation_config', 
            (SELECT COUNT(*) FROM navigation_settings);
    END IF;
    
    -- If still no data, insert default navigation items
    IF NOT EXISTS (SELECT 1 FROM navigation_config LIMIT 1) THEN
        INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at) VALUES
        (gen_random_uuid(), 'dashboard', 'Dashboard', true, 1, NOW(), NOW()),
        (gen_random_uuid(), 'initiatives', 'Initiatives', true, 2, NOW(), NOW()),
        (gen_random_uuid(), 'executive-summary', 'Executive Summary', true, 3, NOW(), NOW()),
        (gen_random_uuid(), 'calendar', 'Calendar', true, 4, NOW(), NOW()),
        (gen_random_uuid(), 'admin', 'Admin', true, 5, NOW(), NOW());
        
        RAISE NOTICE 'Inserted default navigation items into navigation_config';
    END IF;
END $$;

-- Verify the data
SELECT 'navigation_config' as table_name, COUNT(*) as row_count FROM navigation_config
UNION ALL
SELECT 'navigation_settings' as table_name, COUNT(*) as row_count FROM navigation_settings;

-- Show the navigation_config data
SELECT item_key, item_label, is_visible, order_index FROM navigation_config ORDER BY order_index;
