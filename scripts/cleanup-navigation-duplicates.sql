-- Fixed column names to use snake_case instead of camelCase
-- Remove duplicate Executive Summary entries and fix visibility logic
DELETE FROM navigation_settings 
WHERE id IN (
  SELECT id FROM (
    SELECT id, ROW_NUMBER() OVER (PARTITION BY item_key ORDER BY sort_order) as rn
    FROM navigation_settings
  ) t WHERE rn > 1
);

-- Update any items that should be visible by default
UPDATE navigation_settings 
SET is_visible = true 
WHERE item_key IN ('dashboard', 'initiatives', 'executive-summary', 'calendar', 'admin');

-- Remove any items that don't match the main navigation
DELETE FROM navigation_settings 
WHERE item_key NOT IN ('dashboard', 'initiatives', 'executive-summary', 'calendar', 'admin', 'reports', 'achievements', 'settings', 'users');
