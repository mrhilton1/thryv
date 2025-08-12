-- CHECK RLS STATUS AND POLICIES
-- Copy and run this in your Supabase SQL Editor to see current RLS status

-- Check RLS status for all tables
SELECT 
  schemaname,
  tablename,
  rowsecurity as rls_enabled,
  CASE WHEN rowsecurity THEN '✅ ENABLED' ELSE '❌ DISABLED' END as status
FROM pg_tables 
WHERE tablename IN ('users', 'profiles', 'initiatives', 'notes', 'achievements', 'executive_summaries', 'navigation_settings')
ORDER BY tablename;

-- Check current policies
SELECT 
  schemaname,
  tablename,
  policyname,
  cmd as operation,
  CASE 
    WHEN qual = 'true' THEN '✅ ALLOW ALL'
    ELSE '⚠️ RESTRICTED: ' || qual
  END as policy_rule
FROM pg_policies 
WHERE tablename IN ('users', 'profiles', 'initiatives', 'notes', 'achievements', 'executive_summaries', 'navigation_settings')
ORDER BY tablename, policyname;

SELECT 'RLS Status Check Complete!' as status;
