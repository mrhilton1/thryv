-- Harden RLS policies for production. Run after initial schema setup.
-- Assumes `profiles` contains `role` and maps to auth.users.id

-- USERS/PROFILES
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
DROP POLICY IF EXISTS "Profiles: read" ON profiles;
CREATE POLICY "Profiles: read" ON profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
DROP POLICY IF EXISTS "Profiles: update self" ON profiles;
CREATE POLICY "Profiles: update self" ON profiles FOR UPDATE USING (auth.uid() = id);

-- INITIATIVES
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON initiatives;
DROP POLICY IF EXISTS "Initiatives: read" ON initiatives;
CREATE POLICY "Initiatives: read" ON initiatives FOR SELECT USING (true);
DROP POLICY IF EXISTS "Initiatives: insert" ON initiatives;
CREATE POLICY "Initiatives: insert" ON initiatives FOR INSERT WITH CHECK (
  (select role from profiles where id = auth.uid()) IN ('admin','executive','manager')
);
DROP POLICY IF EXISTS "Initiatives: update" ON initiatives;
CREATE POLICY "Initiatives: update" ON initiatives FOR UPDATE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive') OR owner_id = auth.uid()
);
DROP POLICY IF EXISTS "Initiatives: delete" ON initiatives;
CREATE POLICY "Initiatives: delete" ON initiatives FOR DELETE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive')
);

-- ACHIEVEMENTS
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON achievements;
DROP POLICY IF EXISTS "Achievements: read" ON achievements;
CREATE POLICY "Achievements: read" ON achievements FOR SELECT USING (true);
DROP POLICY IF EXISTS "Achievements: insert" ON achievements;
CREATE POLICY "Achievements: insert" ON achievements FOR INSERT WITH CHECK (
  (select role from profiles where id = auth.uid()) IN ('admin','executive','manager')
);
DROP POLICY IF EXISTS "Achievements: update" ON achievements;
CREATE POLICY "Achievements: update" ON achievements FOR UPDATE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive') OR created_by_id = auth.uid()
);
DROP POLICY IF EXISTS "Achievements: delete" ON achievements;
CREATE POLICY "Achievements: delete" ON achievements FOR DELETE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive')
);

-- NOTES
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON notes;
DROP POLICY IF EXISTS "Notes: read" ON notes;
CREATE POLICY "Notes: read" ON notes FOR SELECT USING (true);
DROP POLICY IF EXISTS "Notes: insert" ON notes;
CREATE POLICY "Notes: insert" ON notes FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);
DROP POLICY IF EXISTS "Notes: update" ON notes;
CREATE POLICY "Notes: update" ON notes FOR UPDATE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive') OR created_by_id = auth.uid()
);
DROP POLICY IF EXISTS "Notes: delete" ON notes;
CREATE POLICY "Notes: delete" ON notes FOR DELETE USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive') OR created_by_id = auth.uid()
);

-- EXECUTIVE SUMMARIES
ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON executive_summaries;
DROP POLICY IF EXISTS "Summaries: read" ON executive_summaries;
CREATE POLICY "Summaries: read" ON executive_summaries FOR SELECT USING (true);
DROP POLICY IF EXISTS "Summaries: write" ON executive_summaries;
CREATE POLICY "Summaries: write" ON executive_summaries FOR ALL USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive')
);

-- NAVIGATION SETTINGS/CONFIG
ALTER TABLE navigation_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON navigation_settings;
DROP POLICY IF EXISTS "Navigation: read" ON navigation_settings;
CREATE POLICY "Navigation: read" ON navigation_settings FOR SELECT USING (true);
DROP POLICY IF EXISTS "Navigation: write" ON navigation_settings;
CREATE POLICY "Navigation: write" ON navigation_settings FOR ALL USING (
  (select role from profiles where id = auth.uid()) = 'admin'
);

ALTER TABLE navigation_config ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow read access to navigation_config" ON navigation_config;
DROP POLICY IF EXISTS "Allow insert access to navigation_config" ON navigation_config;
DROP POLICY IF EXISTS "Allow update access to navigation_config" ON navigation_config;
DROP POLICY IF EXISTS "Allow delete access to navigation_config" ON navigation_config;
DROP POLICY IF EXISTS "NavConfig: read" ON navigation_config;
CREATE POLICY "NavConfig: read" ON navigation_config FOR SELECT USING (true);
DROP POLICY IF EXISTS "NavConfig: write" ON navigation_config;
CREATE POLICY "NavConfig: write" ON navigation_config FOR ALL USING (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- CONFIG ITEMS
ALTER TABLE config_items ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON config_items;
DROP POLICY IF EXISTS "Config: read" ON config_items;
CREATE POLICY "Config: read" ON config_items FOR SELECT USING (true);
DROP POLICY IF EXISTS "Config: write" ON config_items;
CREATE POLICY "Config: write" ON config_items FOR ALL USING (
  (select role from profiles where id = auth.uid()) IN ('admin','executive')
);

-- FIELD CONFIGURATIONS
ALTER TABLE field_configurations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow all operations" ON field_configurations;
DROP POLICY IF EXISTS "FieldConfig: read" ON field_configurations;
CREATE POLICY "FieldConfig: read" ON field_configurations FOR SELECT USING (true);
DROP POLICY IF EXISTS "FieldConfig: write" ON field_configurations;
CREATE POLICY "FieldConfig: write" ON field_configurations FOR ALL USING (
  (select role from profiles where id = auth.uid()) = 'admin'
);

-- FIELD MAPPINGS
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view all field mappings" ON field_mappings;
DROP POLICY IF EXISTS "Users can insert field mappings" ON field_mappings;
DROP POLICY IF EXISTS "Users can update their own field mappings" ON field_mappings;
DROP POLICY IF EXISTS "Users can delete their own field mappings" ON field_mappings;
DROP POLICY IF EXISTS "FieldMappings: read" ON field_mappings;
CREATE POLICY "FieldMappings: read" ON field_mappings FOR SELECT USING (true);
DROP POLICY IF EXISTS "FieldMappings: write own" ON field_mappings;
CREATE POLICY "FieldMappings: write own" ON field_mappings FOR INSERT WITH CHECK (created_by_id = auth.uid());
DROP POLICY IF EXISTS "FieldMappings: update own" ON field_mappings;
CREATE POLICY "FieldMappings: update own" ON field_mappings FOR UPDATE USING (created_by_id = auth.uid());
DROP POLICY IF EXISTS "FieldMappings: delete own" ON field_mappings;
CREATE POLICY "FieldMappings: delete own" ON field_mappings FOR DELETE USING (created_by_id = auth.uid());


