-- Remove duplicate Executive Summary entries, keeping the visible one
DELETE FROM navigation_settings 
WHERE id IN (
    SELECT id FROM (
        SELECT id, 
               ROW_NUMBER() OVER (
                   PARTITION BY item_label 
                   ORDER BY 
                       CASE WHEN is_visible = true THEN 0 ELSE 1 END,
                       sort_order ASC
               ) as rn
        FROM navigation_settings 
        WHERE item_label = 'Executive Summary'
    ) ranked 
    WHERE rn > 1
);

-- Update sort order to ensure proper ordering
UPDATE navigation_settings SET sort_order = 1 WHERE item_key = 'dashboard';
UPDATE navigation_settings SET sort_order = 2 WHERE item_key = 'initiatives';
UPDATE navigation_settings SET sort_order = 3 WHERE item_key = 'executive-summary' OR item_label = 'Executive Summary';
UPDATE navigation_settings SET sort_order = 4 WHERE item_key = 'calendar';
UPDATE navigation_settings SET sort_order = 5 WHERE item_key = 'admin';
UPDATE navigation_settings SET sort_order = 6 WHERE item_key = 'users' OR item_label = 'User Management';
UPDATE navigation_settings SET sort_order = 7 WHERE item_key = 'settings';
