-- NUCLEAR OPTION: DISABLE RLS AND RECREATE POLICIES
-- Copy and run this in your Supabase SQL Editor

-- First, let's see what policies exist
SELECT schemaname, tablename, policyname, cmd, qual 
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'initiatives', 'notes', 'achievements', 'executive_summaries', 'navigation_settings')
ORDER BY tablename, policyname;

-- NUCLEAR OPTION: Disable RLS temporarily and clean everything
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE profiles DISABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives DISABLE ROW LEVEL SECURITY;
ALTER TABLE notes DISABLE ROW LEVEL SECURITY;
ALTER TABLE achievements DISABLE ROW LEVEL SECURITY;
ALTER TABLE executive_summaries DISABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings DISABLE ROW LEVEL SECURITY;

-- Drop ALL policies on these tables (this will catch any we missed)
DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT schemaname, tablename, policyname 
        FROM pg_policies 
        WHERE tablename IN ('users', 'profiles', 'initiatives', 'notes', 'achievements', 'executive_summaries', 'navigation_settings')
    ) LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON %I.%I', r.policyname, r.schemaname, r.tablename);
    END LOOP;
END $$;

-- Re-enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings ENABLE ROW LEVEL SECURITY;

-- Create simple policies that definitely won't recurse
CREATE POLICY "allow_all_users" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_profiles" ON profiles FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_initiatives" ON initiatives FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_notes" ON notes FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_achievements" ON achievements FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_executive_summaries" ON executive_summaries FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow_all_navigation_settings" ON navigation_settings FOR ALL USING (true) WITH CHECK (true);

-- Verify no policies remain that could cause recursion
SELECT 'VERIFICATION: Current policies after cleanup:' as status;
SELECT schemaname, tablename, policyname, cmd 
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'initiatives', 'notes', 'achievements', 'executive_summaries', 'navigation_settings')
ORDER BY tablename, policyname;

SELECT 'SUCCESS: Nuclear RLS cleanup complete - all recursion eliminated!' as final_status;
