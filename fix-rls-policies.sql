-- FIX RLS POLICY INFINITE RECURSION
-- Copy and run this in your Supabase SQL Editor

-- Drop all existing policies that cause recursion (if they exist)
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON profiles;
DROP POLICY IF EXISTS "Allow all operations" ON initiatives;
DROP POLICY IF EXISTS "Allow all operations" ON notes;
DROP POLICY IF EXISTS "Allow all operations" ON achievements;
DROP POLICY IF EXISTS "Allow all operations" ON executive_summaries;
DROP POLICY IF EXISTS "Allow all operations" ON navigation_settings;

-- Drop any existing policies with the new names too
DROP POLICY IF EXISTS "users_select_policy" ON users;
DROP POLICY IF EXISTS "users_insert_policy" ON users;
DROP POLICY IF EXISTS "users_update_policy" ON users;
DROP POLICY IF EXISTS "users_delete_policy" ON users;

DROP POLICY IF EXISTS "profiles_select_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_insert_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_update_policy" ON profiles;
DROP POLICY IF EXISTS "profiles_delete_policy" ON profiles;

DROP POLICY IF EXISTS "initiatives_select_policy" ON initiatives;
DROP POLICY IF EXISTS "initiatives_insert_policy" ON initiatives;
DROP POLICY IF EXISTS "initiatives_update_policy" ON initiatives;
DROP POLICY IF EXISTS "initiatives_delete_policy" ON initiatives;

DROP POLICY IF EXISTS "notes_select_policy" ON notes;
DROP POLICY IF EXISTS "notes_insert_policy" ON notes;
DROP POLICY IF EXISTS "notes_update_policy" ON notes;
DROP POLICY IF EXISTS "notes_delete_policy" ON notes;

DROP POLICY IF EXISTS "achievements_select_policy" ON achievements;
DROP POLICY IF EXISTS "achievements_insert_policy" ON achievements;
DROP POLICY IF EXISTS "achievements_update_policy" ON achievements;
DROP POLICY IF EXISTS "achievements_delete_policy" ON achievements;

DROP POLICY IF EXISTS "executive_summaries_select_policy" ON executive_summaries;
DROP POLICY IF EXISTS "executive_summaries_insert_policy" ON executive_summaries;
DROP POLICY IF EXISTS "executive_summaries_update_policy" ON executive_summaries;
DROP POLICY IF EXISTS "executive_summaries_delete_policy" ON executive_summaries;

DROP POLICY IF EXISTS "navigation_settings_select_policy" ON navigation_settings;
DROP POLICY IF EXISTS "navigation_settings_insert_policy" ON navigation_settings;
DROP POLICY IF EXISTS "navigation_settings_update_policy" ON navigation_settings;
DROP POLICY IF EXISTS "navigation_settings_delete_policy" ON navigation_settings;

-- Create simple, non-recursive policies
-- Users table policies
CREATE POLICY "users_select_policy" ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_policy" ON users FOR INSERT WITH CHECK (true);
CREATE POLICY "users_update_policy" ON users FOR UPDATE USING (true);
CREATE POLICY "users_delete_policy" ON users FOR DELETE USING (true);

-- Profiles table policies  
CREATE POLICY "profiles_select_policy" ON profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_policy" ON profiles FOR INSERT WITH CHECK (true);
CREATE POLICY "profiles_update_policy" ON profiles FOR UPDATE USING (true);
CREATE POLICY "profiles_delete_policy" ON profiles FOR DELETE USING (true);

-- Initiatives table policies
CREATE POLICY "initiatives_select_policy" ON initiatives FOR SELECT USING (true);
CREATE POLICY "initiatives_insert_policy" ON initiatives FOR INSERT WITH CHECK (true);
CREATE POLICY "initiatives_update_policy" ON initiatives FOR UPDATE USING (true);
CREATE POLICY "initiatives_delete_policy" ON initiatives FOR DELETE USING (true);

-- Notes table policies
CREATE POLICY "notes_select_policy" ON notes FOR SELECT USING (true);
CREATE POLICY "notes_insert_policy" ON notes FOR INSERT WITH CHECK (true);
CREATE POLICY "notes_update_policy" ON notes FOR UPDATE USING (true);
CREATE POLICY "notes_delete_policy" ON notes FOR DELETE USING (true);

-- Achievements table policies
CREATE POLICY "achievements_select_policy" ON achievements FOR SELECT USING (true);
CREATE POLICY "achievements_insert_policy" ON achievements FOR INSERT WITH CHECK (true);
CREATE POLICY "achievements_update_policy" ON achievements FOR UPDATE USING (true);
CREATE POLICY "achievements_delete_policy" ON achievements FOR DELETE USING (true);

-- Executive summaries table policies
CREATE POLICY "executive_summaries_select_policy" ON executive_summaries FOR SELECT USING (true);
CREATE POLICY "executive_summaries_insert_policy" ON executive_summaries FOR INSERT WITH CHECK (true);
CREATE POLICY "executive_summaries_update_policy" ON executive_summaries FOR UPDATE USING (true);
CREATE POLICY "executive_summaries_delete_policy" ON executive_summaries FOR DELETE USING (true);

-- Navigation settings table policies
CREATE POLICY "navigation_settings_select_policy" ON navigation_settings FOR SELECT USING (true);
CREATE POLICY "navigation_settings_insert_policy" ON navigation_settings FOR INSERT WITH CHECK (true);
CREATE POLICY "navigation_settings_update_policy" ON navigation_settings FOR UPDATE USING (true);
CREATE POLICY "navigation_settings_delete_policy" ON navigation_settings FOR DELETE USING (true);

SELECT 'SUCCESS: RLS policies fixed - no more infinite recursion!' as status;
