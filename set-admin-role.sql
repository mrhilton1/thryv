-- =============================================
-- SET YOUR USER TO ADMIN ROLE
-- =============================================
-- Run this AFTER you manually created your user
-- Replace 'your-email@company.com' with your actual email

-- First, check if a profile was created for your user
SELECT 
  u.email,
  u.id as user_id,
  p.id as profile_id,
  p.role,
  p.full_name
FROM auth.users u
LEFT JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@company.com'; -- CHANGE THIS EMAIL

-- If no profile exists, create one manually
INSERT INTO profiles (id, full_name, role)
SELECT 
  u.id,
  COALESCE(u.raw_user_meta_data->>'full_name', 'Admin User'),
  'admin'
FROM auth.users u
WHERE u.email = 'your-email@company.com' -- CHANGE THIS EMAIL
  AND NOT EXISTS (SELECT 1 FROM profiles WHERE id = u.id);

-- Update the user's role to admin
UPDATE profiles 
SET role = 'admin' 
WHERE id = (
  SELECT id FROM auth.users 
  WHERE email = 'your-email@company.com' -- CHANGE THIS EMAIL
);

-- Verify the update worked
SELECT 
  u.email,
  p.role,
  p.full_name,
  'SUCCESS: User is now admin!' as status
FROM auth.users u
JOIN profiles p ON u.id = p.id
WHERE u.email = 'your-email@company.com'; -- CHANGE THIS EMAIL
