-- Fix existing tables and relationships
-- Handle case where tables already exist

-- First, check if we need to update foreign key relationships
DO $$
BEGIN
    -- Update initiatives table foreign keys to point to profiles instead of users
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'initiatives' AND column_name = 'owner_id') THEN
        -- Drop existing foreign key constraints if they exist
        ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_owner_id_fkey;
        ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS initiatives_created_by_id_fkey;
        
        -- Add new foreign key constraints pointing to profiles table
        ALTER TABLE initiatives ADD CONSTRAINT initiatives_owner_id_fkey 
            FOREIGN KEY (owner_id) REFERENCES profiles(id) ON DELETE SET NULL;
        ALTER TABLE initiatives ADD CONSTRAINT initiatives_created_by_id_fkey 
            FOREIGN KEY (created_by_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Update achievements table foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'achievements' AND column_name = 'created_by_id') THEN
        ALTER TABLE achievements DROP CONSTRAINT IF EXISTS achievements_created_by_id_fkey;
        ALTER TABLE achievements ADD CONSTRAINT achievements_created_by_id_fkey 
            FOREIGN KEY (created_by_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Update stakeholder_updates table foreign keys
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'stakeholder_updates' AND column_name = 'created_by_id') THEN
        ALTER TABLE stakeholder_updates DROP CONSTRAINT IF EXISTS stakeholder_updates_created_by_id_fkey;
        ALTER TABLE stakeholder_updates ADD CONSTRAINT stakeholder_updates_created_by_id_fkey 
            FOREIGN KEY (created_by_id) REFERENCES profiles(id) ON DELETE SET NULL;
    END IF;

    -- Ensure navigation_config table exists with correct structure
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'navigation_config') THEN
        CREATE TABLE navigation_config (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            item_key TEXT NOT NULL UNIQUE,
            item_label TEXT NOT NULL,
            is_visible BOOLEAN DEFAULT true,
            order_index INTEGER NOT NULL,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );
        
        -- Copy data from navigation_settings if it exists
        IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'navigation_settings') THEN
            INSERT INTO navigation_config (id, item_key, item_label, is_visible, order_index, created_at, updated_at)
            SELECT id, item_key, item_label, is_visible, sort_order, created_at, updated_at
            FROM navigation_settings;
        END IF;
    ELSE
        -- If navigation_config exists but doesn't have order_index, add it
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'navigation_config' AND column_name = 'order_index') THEN
            ALTER TABLE navigation_config ADD COLUMN order_index INTEGER;
            UPDATE navigation_config SET order_index = COALESCE((SELECT sort_order FROM navigation_settings WHERE navigation_settings.id = navigation_config.id), 0);
        END IF;
    END IF;

    -- Ensure profiles table has all required columns
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'name') THEN
        ALTER TABLE profiles ADD COLUMN name TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'email') THEN
        ALTER TABLE profiles ADD COLUMN email TEXT;
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'role') THEN
        ALTER TABLE profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;

    -- Copy missing data from users table if it exists and profiles is empty
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') 
       AND NOT EXISTS (SELECT 1 FROM profiles LIMIT 1) THEN
        INSERT INTO profiles (id, name, email, role, created_at, updated_at)
        SELECT id, name, email, COALESCE(role, 'user'), created_at, updated_at
        FROM users
        ON CONFLICT (id) DO NOTHING;
    END IF;

END $$;

-- Enable RLS on profiles table
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create simple RLS policies for profiles
DROP POLICY IF EXISTS "Users can view all profiles" ON profiles;
CREATE POLICY "Users can view all profiles" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can update own profile" ON profiles;
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_initiatives_owner_id ON initiatives(owner_id);
CREATE INDEX IF NOT EXISTS idx_initiatives_created_by_id ON initiatives(created_by_id);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON profiles(email);
CREATE INDEX IF NOT EXISTS idx_navigation_config_order_index ON navigation_config(order_index);

-- Refresh the schema cache
NOTIFY pgrst, 'reload schema';
