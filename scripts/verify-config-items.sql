-- Verify that product_areas and gtm_types have data
SELECT 
  'product_areas' as check_type,
  COUNT(*) as count,
  string_agg(label, ', ' ORDER BY sort_order) as items
FROM config_items 
WHERE category = 'product_areas' AND is_active = true

UNION ALL

SELECT 
  'gtm_types' as check_type,
  COUNT(*) as count,
  string_agg(label, ', ' ORDER BY sort_order) as items
FROM config_items 
WHERE category = 'gtm_types' AND is_active = true

UNION ALL

SELECT 
  'all_categories' as check_type,
  COUNT(DISTINCT category) as count,
  string_agg(DISTINCT category, ', ' ORDER BY category) as items
FROM config_items 
WHERE is_active = true;
