-- First, let's make sure we have product areas
INSERT INTO config_items (id, category, label, color, sort_order, is_active, created_by_id) 
VALUES 
  (gen_random_uuid(), 'product_areas', 'Core Platform', 'blue', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'product_areas', 'Mobile App', 'green', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'product_areas', 'Web Portal', 'purple', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'product_areas', 'API & Integrations', 'orange', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'product_areas', 'Analytics & Reporting', 'pink', 5, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'product_areas', 'Security & Compliance', 'red', 6, true, (SELECT id FROM users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Add GTM Types
INSERT INTO config_items (id, category, label, color, sort_order, is_active, created_by_id) 
VALUES 
  (gen_random_uuid(), 'gtm_types', 'Major Release', 'green', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'gtm_types', 'Minor Release', 'blue', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'gtm_types', 'Feature Flag', 'yellow', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'gtm_types', 'Beta Release', 'orange', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'gtm_types', 'Internal Only', 'gray', 5, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'gtm_types', 'Partner Release', 'purple', 6, true, (SELECT id FROM users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Make sure we have all other required categories too
INSERT INTO config_items (id, category, label, color, sort_order, is_active, created_by_id) 
VALUES 
  -- Teams
  (gen_random_uuid(), 'teams', 'Engineering', 'blue', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'teams', 'Product', 'green', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'teams', 'Design', 'purple', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'teams', 'Marketing', 'orange', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'teams', 'Sales', 'red', 5, true, (SELECT id FROM users LIMIT 1)),
  
  -- Business Impacts
  (gen_random_uuid(), 'business_impacts', 'Increase Revenue', 'green', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'business_impacts', 'Reduce Costs', 'blue', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'business_impacts', 'Improve Efficiency', 'purple', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'business_impacts', 'Customer Satisfaction', 'orange', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'business_impacts', 'Market Expansion', 'pink', 5, true, (SELECT id FROM users LIMIT 1)),
  
  -- Process Stages
  (gen_random_uuid(), 'process_stages', 'Planned', 'gray', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'process_stages', 'In Progress', 'blue', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'process_stages', 'Testing', 'yellow', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'process_stages', 'Ready for Release', 'green', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'process_stages', 'Released', 'purple', 5, true, (SELECT id FROM users LIMIT 1)),
  
  -- Priorities
  (gen_random_uuid(), 'priorities', 'Low', 'gray', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'priorities', 'Medium', 'blue', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'priorities', 'High', 'orange', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'priorities', 'Critical', 'red', 4, true, (SELECT id FROM users LIMIT 1)),
  
  -- Statuses
  (gen_random_uuid(), 'statuses', 'On Track', 'green', 1, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'statuses', 'At Risk', 'yellow', 2, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'statuses', 'Off Track', 'red', 3, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'statuses', 'Complete', 'blue', 4, true, (SELECT id FROM users LIMIT 1)),
  (gen_random_uuid(), 'statuses', 'Cancelled', 'gray', 5, true, (SELECT id FROM users LIMIT 1))
ON CONFLICT (id) DO NOTHING;
