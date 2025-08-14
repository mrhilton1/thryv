-- Add GTM Type options to config_items table
INSERT INTO config_items (category, key, value, label, description, display_order, is_active, created_at, updated_at)
VALUES 
  ('gtmTypes', 'new_product', 'New Product Launch', 'New Product Launch', 'Launch of a completely new product', 1, true, NOW(), NOW()),
  ('gtmTypes', 'product_update', 'product_update', 'Product Update', 'Update to existing product features', 2, true, NOW(), NOW()),
  ('gtmTypes', 'market_expansion', 'Market Expansion', 'Market Expansion', 'Expanding into new markets or segments', 3, true, NOW(), NOW()),
  ('gtmTypes', 'feature_enhancement', 'feature_release', 'Feature Release', 'Enhancement of existing features', 4, true, NOW(), NOW()),
  ('gtmTypes', 'integration', 'partnership', 'Partnership Launch', 'New integrations or partnerships', 5, true, NOW(), NOW()),
  ('gtmTypes', 'pricing_change', 'pricing_change', 'Pricing Change', 'Changes to pricing strategy', 6, true, NOW(), NOW()),
  ('gtmTypes', 'rebranding', 'rebranding', 'Rebranding Initiative', 'Brand or messaging updates', 7, true, NOW(), NOW()),
  ('gtmTypes', 'competitive_response', 'competitive_response', 'Competitive Response', 'Response to competitive moves', 8, true, NOW(), NOW()),
  ('gtmTypes', 'seasonal_campaign', 'seasonal_campaign', 'Seasonal Campaign', 'Seasonal marketing campaigns', 9, true, NOW(), NOW()),
  ('gtmTypes', 'customer_expansion', 'customer_expansion', 'Customer Expansion', 'Increasing customer base', 10, true, NOW(), NOW())
ON CONFLICT (category, key) DO UPDATE SET
  value = EXCLUDED.value,
  label = EXCLUDED.label,
  description = EXCLUDED.description,
  display_order = EXCLUDED.display_order,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
