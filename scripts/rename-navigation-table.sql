-- Simple migration to rename navigation table and column to match application expectations

-- Rename the table from navigation_settings to navigation_config
ALTER TABLE navigation_settings RENAME TO navigation_config;

-- Rename the column from sort_order to order_index  
ALTER TABLE navigation_config RENAME COLUMN sort_order TO order_index;

-- Also rename users table to profiles to match application expectations
ALTER TABLE users RENAME TO profiles;

-- Update any foreign key references in other tables
ALTER TABLE initiatives RENAME COLUMN owner_id TO owner_id;
ALTER TABLE initiatives RENAME COLUMN created_by_id TO created_by_id;
ALTER TABLE notes RENAME COLUMN created_by_id TO created_by_id;
ALTER TABLE achievements RENAME COLUMN created_by_id TO created_by_id;
ALTER TABLE executive_summaries RENAME COLUMN created_by_id TO created_by_id;

-- Update RLS policies for the renamed tables
DROP POLICY IF EXISTS "Allow all operations" ON navigation_config;
DROP POLICY IF EXISTS "Allow all operations" ON profiles;

CREATE POLICY "Allow all operations" ON navigation_config FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON profiles FOR ALL USING (true);

-- Update indexes
DROP INDEX IF EXISTS idx_navigation_settings_visible;
CREATE INDEX IF NOT EXISTS idx_navigation_config_visible ON navigation_config(is_visible, order_index);
