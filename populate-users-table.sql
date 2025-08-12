-- =============================================
-- POPULATE USERS TABLE AND LINK TO PROFILES
-- =============================================
-- This creates entries in the users table and links them to profiles
-- Run this after you have profiles created

-- First, let's see what profiles exist
SELECT 
  p.id,
  p.full_name,
  p.role,
  au.email,
  'Profile exists, need to create user record' as status
FROM profiles p
JOIN auth.users au ON p.id = au.id;

-- Create users table entries for existing profiles
INSERT INTO users (id, name, email, role, profile_id, created_at, updated_at)
SELECT 
  p.id,
  COALESCE(p.full_name, 'User'),
  au.email,
  p.role,
  p.id,  -- Link to profile
  NOW(),
  NOW()
FROM profiles p
JOIN auth.users au ON p.id = au.id
WHERE NOT EXISTS (
  SELECT 1 FROM users u WHERE u.profile_id = p.id
);

-- Verify the users were created and linked
SELECT 
  u.name,
  u.email,
  u.role,
  p.role as profile_role,
  'SUCCESS: User linked to profile' as status
FROM users u
JOIN profiles p ON u.profile_id = p.id;

-- Add some sample data to other tables for testing
-- Sample initiatives
INSERT INTO initiatives (
  title, 
  description, 
  status, 
  priority, 
  tier, 
  progress, 
  start_date, 
  end_date, 
  owner_id, 
  created_by_id,
  created_at,
  updated_at
)
SELECT 
  'Digital Transformation Initiative',
  'Modernize our technology stack and improve digital capabilities',
  'on-track',
  'high',
  1,
  75,
  '2024-01-01'::date,
  '2024-12-31'::date,
  u.id,  -- owner_id from auth user
  u.id,  -- created_by_id from auth user
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

INSERT INTO initiatives (
  title, 
  description, 
  status, 
  priority, 
  tier, 
  progress, 
  start_date, 
  end_date, 
  owner_id, 
  created_by_id,
  created_at,
  updated_at
)
SELECT 
  'Customer Experience Enhancement',
  'Improve customer satisfaction and retention rates',
  'at-risk',
  'critical',
  1,
  45,
  '2024-02-01'::date,
  '2024-08-31'::date,
  u.id,
  u.id,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample notes
INSERT INTO notes (initiative_id, content, created_by_id, created_at, updated_at)
SELECT 
  i.id,
  'Initial planning phase completed successfully. Moving to implementation.',
  u.id,
  NOW(),
  NOW()
FROM initiatives i
CROSS JOIN users u
WHERE i.title = 'Digital Transformation Initiative'
  AND u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample achievements
INSERT INTO achievements (
  initiative_id,
  title,
  description,
  type,
  date_achieved,
  created_by_id,
  created_at,
  updated_at
)
SELECT 
  i.id,
  'Phase 1 Milestone Completed',
  'Successfully completed the first phase of digital transformation',
  'milestone',
  '2024-03-15'::date,
  u.id,
  NOW(),
  NOW()
FROM initiatives i
CROSS JOIN users u
WHERE i.title = 'Digital Transformation Initiative'
  AND u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Sample executive summary
INSERT INTO executive_summaries (
  title,
  content,
  summary_date,
  created_by_id,
  created_at,
  updated_at
)
SELECT 
  'Q2 2024 Executive Summary',
  'Overall progress is on track with digital transformation showing strong results. Customer experience initiative requires additional attention and resources.',
  '2024-06-30'::date,
  u.id,
  NOW(),
  NOW()
FROM users u
WHERE u.role = 'admin'
LIMIT 1
ON CONFLICT DO NOTHING;

-- Verify everything was created
SELECT 'VERIFICATION RESULTS:' as section;

SELECT 'Users:' as table_name, COUNT(*) as count FROM users
UNION ALL
SELECT 'Profiles:', COUNT(*) FROM profiles
UNION ALL
SELECT 'Initiatives:', COUNT(*) FROM initiatives
UNION ALL
SELECT 'Notes:', COUNT(*) FROM notes
UNION ALL
SELECT 'Achievements:', COUNT(*) FROM achievements
UNION ALL
SELECT 'Executive Summaries:', COUNT(*) FROM executive_summaries
UNION ALL
SELECT 'Navigation Settings:', COUNT(*) FROM navigation_settings;

SELECT 'SUCCESS: All tables populated with sample data!' as final_status;
