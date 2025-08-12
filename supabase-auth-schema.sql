-- =============================================
-- SUPABASE AUTH + EXECUTIVE DASHBOARD SCHEMA
-- =============================================
-- This integrates Supabase Auth with your executive dashboard
-- Run this in Supabase SQL Editor

-- Create a table for public profiles (extends auth.users)
CREATE TABLE IF NOT EXISTS profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  username text unique,
  full_name text,
  avatar_url text,
  website text,
  role text default 'user' check (role in ('admin', 'executive', 'manager', 'user')),
  constraint username_length check (char_length(username) >= 3)
);

-- Set up Row Level Security (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON profiles;

-- Create RLS policies for profiles
CREATE POLICY "Public profiles are viewable by everyone." ON profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can insert their own profile." ON profiles
  FOR INSERT WITH CHECK ((SELECT auth.uid()) = id);

CREATE POLICY "Users can update own profile." ON profiles
  FOR UPDATE USING ((SELECT auth.uid()) = id);

-- Helper function to get user role (prevents RLS recursion)
CREATE OR REPLACE FUNCTION get_user_role(user_id uuid)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN (SELECT role FROM profiles WHERE id = user_id);
END;
$$;

-- This trigger automatically creates a profile entry when a new user signs up
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, avatar_url, username, role)
  VALUES (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'avatar_url',
    new.raw_user_meta_data->>'username',
    'user' -- Default role, can be changed by admin
  );
  RETURN new;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Set up Storage for avatars
INSERT INTO storage.buckets (id, name)
  VALUES ('avatars', 'avatars')
  ON CONFLICT (id) DO NOTHING;

-- Storage policies
DROP POLICY IF EXISTS "Avatar images are publicly accessible." ON storage.objects;
DROP POLICY IF EXISTS "Anyone can upload an avatar." ON storage.objects;

CREATE POLICY "Avatar images are publicly accessible." ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

CREATE POLICY "Anyone can upload an avatar." ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'avatars');

-- =============================================
-- EXECUTIVE DASHBOARD TABLES
-- =============================================

-- Create initiatives table
CREATE TABLE IF NOT EXISTS initiatives (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  status text default 'planning' check (status in ('planning', 'in-progress', 'completed', 'on-hold')),
  priority text default 'medium' check (priority in ('low', 'medium', 'high', 'critical')),
  start_date date,
  end_date date,
  owner_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create notes table
CREATE TABLE IF NOT EXISTS notes (
  id uuid default gen_random_uuid() primary key,
  initiative_id uuid references initiatives(id) on delete cascade,
  content text not null,
  author_id uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create achievements table
CREATE TABLE IF NOT EXISTS achievements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  initiative_id uuid references initiatives(id) on delete cascade,
  achieved_date date default current_date,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create executive summaries table
CREATE TABLE IF NOT EXISTS executive_summaries (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  summary_date date default current_date,
  created_by uuid references profiles(id),
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Create navigation settings table
CREATE TABLE IF NOT EXISTS navigation_settings (
  id uuid default gen_random_uuid() primary key,
  item_name text not null unique,
  is_visible boolean default true,
  display_order integer default 0,
  updated_by uuid references profiles(id),
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS on all tables
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view initiatives" ON initiatives;
DROP POLICY IF EXISTS "Users can create initiatives" ON initiatives;
DROP POLICY IF EXISTS "Users can update initiatives" ON initiatives;
DROP POLICY IF EXISTS "Users can delete initiatives" ON initiatives;

DROP POLICY IF EXISTS "Users can view notes" ON notes;
DROP POLICY IF EXISTS "Users can create notes" ON notes;
DROP POLICY IF EXISTS "Users can update notes" ON notes;
DROP POLICY IF EXISTS "Users can delete notes" ON notes;

DROP POLICY IF EXISTS "Users can view achievements" ON achievements;
DROP POLICY IF EXISTS "Users can create achievements" ON achievements;
DROP POLICY IF EXISTS "Users can update achievements" ON achievements;
DROP POLICY IF EXISTS "Users can delete achievements" ON achievements;

DROP POLICY IF EXISTS "Users can view executive summaries" ON executive_summaries;
DROP POLICY IF EXISTS "Users can create executive summaries" ON executive_summaries;
DROP POLICY IF EXISTS "Users can update executive summaries" ON executive_summaries;
DROP POLICY IF EXISTS "Users can delete executive summaries" ON executive_summaries;

DROP POLICY IF EXISTS "Users can view navigation settings" ON navigation_settings;
DROP POLICY IF EXISTS "Users can update navigation settings" ON navigation_settings;

-- RLS Policies for initiatives
CREATE POLICY "Users can view initiatives" ON initiatives
  FOR SELECT USING (true);

CREATE POLICY "Users can create initiatives" ON initiatives
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'executive', 'manager')
  );

CREATE POLICY "Users can update initiatives" ON initiatives
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive') OR 
    owner_id = auth.uid()
  );

CREATE POLICY "Users can delete initiatives" ON initiatives
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive')
  );

-- RLS Policies for notes
CREATE POLICY "Users can view notes" ON notes
  FOR SELECT USING (true);

CREATE POLICY "Users can create notes" ON notes
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update notes" ON notes
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive') OR 
    author_id = auth.uid()
  );

CREATE POLICY "Users can delete notes" ON notes
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive') OR 
    author_id = auth.uid()
  );

-- RLS Policies for achievements
CREATE POLICY "Users can view achievements" ON achievements
  FOR SELECT USING (true);

CREATE POLICY "Users can create achievements" ON achievements
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'executive', 'manager')
  );

CREATE POLICY "Users can update achievements" ON achievements
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive') OR 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete achievements" ON achievements
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive')
  );

-- RLS Policies for executive summaries
CREATE POLICY "Users can view executive summaries" ON executive_summaries
  FOR SELECT USING (true);

CREATE POLICY "Users can create executive summaries" ON executive_summaries
  FOR INSERT WITH CHECK (
    get_user_role(auth.uid()) IN ('admin', 'executive')
  );

CREATE POLICY "Users can update executive summaries" ON executive_summaries
  FOR UPDATE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive') OR 
    created_by = auth.uid()
  );

CREATE POLICY "Users can delete executive summaries" ON executive_summaries
  FOR DELETE USING (
    get_user_role(auth.uid()) IN ('admin', 'executive')
  );

-- RLS Policies for navigation settings
CREATE POLICY "Users can view navigation settings" ON navigation_settings
  FOR SELECT USING (true);

CREATE POLICY "Users can update navigation settings" ON navigation_settings
  FOR UPDATE USING (
    get_user_role(auth.uid()) = 'admin'
  );

-- Insert default navigation settings
INSERT INTO navigation_settings (item_name, is_visible, display_order) VALUES
  ('Dashboard', true, 1),
  ('Initiatives', true, 2),
  ('Calendar', true, 3),
  ('Achievements', true, 4),
  ('Executive Summary', true, 5),
  ('Admin Panel', true, 6)
ON CONFLICT (item_name) DO NOTHING;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ SUCCESS: Executive Dashboard schema created successfully!';
  RAISE NOTICE '📊 Tables created: profiles, initiatives, notes, achievements, executive_summaries, navigation_settings';
  RAISE NOTICE '🔒 RLS policies: % policies created', (SELECT count(*) FROM pg_policies WHERE schemaname = 'public');
  RAISE NOTICE '🚀 NEXT STEP: Enable Authentication in Supabase Dashboard, then create your first admin user';
END $$;
