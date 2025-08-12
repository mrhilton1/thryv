-- Check what config items exist and their categories
SELECT 
  category,
  label,
  color,
  sort_order,
  is_active,
  created_at
FROM config_items 
WHERE is_active = true
ORDER BY category, sort_order;

-- Check specifically for product_areas and gtm_types
SELECT 
  category,
  COUNT(*) as count,
  array_agg(label ORDER BY sort_order) as labels
FROM config_items 
WHERE category IN ('product_areas', 'gtm_types') 
  AND is_active = true
GROUP BY category;

-- Check all categories
SELECT 
  category,
  COUNT(*) as count
FROM config_items 
WHERE is_active = true
GROUP BY category
ORDER BY category;
