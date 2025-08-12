-- Seed config_items table with initial data
-- Clear existing data first
DELETE FROM config_items;

-- Get a user ID for created_by (using the first admin user)
DO $$
DECLARE
    admin_user_id UUID;
BEGIN
    SELECT id INTO admin_user_id FROM users WHERE role = 'admin' LIMIT 1;
    
    -- If no admin user found, use the first user
    IF admin_user_id IS NULL THEN
        SELECT id INTO admin_user_id FROM users LIMIT 1;
    END IF;

    -- Teams
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('teams', 'Engineering', 'blue', 0, admin_user_id),
        ('teams', 'Product', 'green', 1, admin_user_id),
        ('teams', 'Design', 'purple', 2, admin_user_id),
        ('teams', 'Marketing', 'orange', 3, admin_user_id),
        ('teams', 'Sales', 'red', 4, admin_user_id),
        ('teams', 'Operations', 'gray', 5, admin_user_id);

    -- Business Impacts
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('business_impacts', 'Increase Revenue', 'green', 0, admin_user_id),
        ('business_impacts', 'Reduce Costs', 'blue', 1, admin_user_id),
        ('business_impacts', 'Improve Efficiency', 'purple', 2, admin_user_id),
        ('business_impacts', 'Customer Satisfaction', 'orange', 3, admin_user_id),
        ('business_impacts', 'Market Expansion', 'red', 4, admin_user_id),
        ('business_impacts', 'Risk Mitigation', 'yellow', 5, admin_user_id);

    -- Product Areas
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('product_areas', 'Core Platform', 'blue', 0, admin_user_id),
        ('product_areas', 'Mobile App', 'green', 1, admin_user_id),
        ('product_areas', 'Web Portal', 'purple', 2, admin_user_id),
        ('product_areas', 'API Services', 'orange', 3, admin_user_id),
        ('product_areas', 'Analytics', 'red', 4, admin_user_id),
        ('product_areas', 'Infrastructure', 'gray', 5, admin_user_id);

    -- Process Stages
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('process_stages', 'Discovery', 'yellow', 0, admin_user_id),
        ('process_stages', 'Planning', 'blue', 1, admin_user_id),
        ('process_stages', 'Development', 'orange', 2, admin_user_id),
        ('process_stages', 'Testing', 'purple', 3, admin_user_id),
        ('process_stages', 'Deployment', 'green', 4, admin_user_id),
        ('process_stages', 'Complete', 'gray', 5, admin_user_id);

    -- Priorities
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('priorities', 'Critical', 'red', 0, admin_user_id),
        ('priorities', 'High', 'orange', 1, admin_user_id),
        ('priorities', 'Medium', 'yellow', 2, admin_user_id),
        ('priorities', 'Low', 'green', 3, admin_user_id);

    -- Statuses
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('statuses', 'On Track', 'green', 0, admin_user_id),
        ('statuses', 'At Risk', 'yellow', 1, admin_user_id),
        ('statuses', 'Off Track', 'red', 2, admin_user_id),
        ('statuses', 'Blocked', 'red', 3, admin_user_id),
        ('statuses', 'Complete', 'blue', 4, admin_user_id),
        ('statuses', 'Cancelled', 'gray', 5, admin_user_id);

    -- GTM Types
    INSERT INTO config_items (category, label, color, sort_order, created_by_id) VALUES
        ('gtm_types', 'Soft Launch', 'yellow', 0, admin_user_id),
        ('gtm_types', 'Beta Release', 'orange', 1, admin_user_id),
        ('gtm_types', 'Full Launch', 'green', 2, admin_user_id),
        ('gtm_types', 'Phased Rollout', 'blue', 3, admin_user_id),
        ('gtm_types', 'Internal Only', 'gray', 4, admin_user_id);

END $$;
