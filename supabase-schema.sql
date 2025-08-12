-- Executive Dashboard Database Schema
-- Run this in your Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('admin', 'executive', 'manager', 'user')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Initiatives table
CREATE TABLE IF NOT EXISTS initiatives (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    description TEXT,
    status TEXT NOT NULL CHECK (status IN ('on-track', 'at-risk', 'off-track', 'complete', 'cancelled')),
    priority TEXT NOT NULL CHECK (priority IN ('low', 'medium', 'high', 'critical')),
    tier INTEGER NOT NULL CHECK (tier IN (1, 2, 3)),
    progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    owner_id UUID REFERENCES users(id),
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Achievements table
CREATE TABLE IF NOT EXISTS achievements (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    initiative_id UUID REFERENCES initiatives(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    type TEXT NOT NULL CHECK (type IN ('achievement', 'milestone')),
    date_achieved DATE NOT NULL,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Executive summaries table
CREATE TABLE IF NOT EXISTS executive_summaries (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    summary_date DATE NOT NULL,
    created_by_id UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Navigation settings table
CREATE TABLE IF NOT EXISTS navigation_settings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    item_key TEXT UNIQUE NOT NULL,
    item_label TEXT NOT NULL,
    is_visible BOOLEAN DEFAULT true,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert sample data
INSERT INTO users (name, email, role) VALUES
    ('John Doe', 'john@example.com', 'admin'),
    ('Jane Smith', 'jane@example.com', 'executive'),
    ('Bob Johnson', 'bob@example.com', 'manager'),
    ('Alice Wilson', 'alice@example.com', 'user')
ON CONFLICT (email) DO NOTHING;

-- Get user IDs for foreign key references
DO $$
DECLARE
    john_id UUID;
    jane_id UUID;
    bob_id UUID;
    alice_id UUID;
BEGIN
    SELECT id INTO john_id FROM users WHERE email = 'john@example.com';
    SELECT id INTO jane_id FROM users WHERE email = 'jane@example.com';
    SELECT id INTO bob_id FROM users WHERE email = 'bob@example.com';
    SELECT id INTO alice_id FROM users WHERE email = 'alice@example.com';

    -- Insert initiatives with proper foreign keys
    INSERT INTO initiatives (title, description, status, priority, tier, progress, start_date, end_date, owner_id, created_by_id) VALUES
        ('Digital Transformation Initiative', 'Modernize our technology stack and processes', 'on-track', 'high', 1, 75, '2024-01-01'::date, '2024-12-31'::date, jane_id, john_id),
        ('Customer Experience Enhancement', 'Improve customer satisfaction and retention', 'at-risk', 'critical', 1, 45, '2024-02-01'::date, '2024-08-31'::date, bob_id, jane_id),
        ('Cost Optimization Program', 'Reduce operational costs by 15%', 'on-track', 'medium', 2, 60, '2024-03-01'::date, '2024-09-30'::date, alice_id, john_id),
        ('Market Expansion Strategy', 'Enter new geographic markets', 'off-track', 'high', 1, 25, '2024-04-01'::date, '2024-11-30'::date, jane_id, bob_id)
    ON CONFLICT DO NOTHING;

    -- Insert notes
    INSERT INTO notes (initiative_id, content, created_by_id) 
    SELECT i.id, 'Initial planning phase completed successfully', john_id
    FROM initiatives i WHERE i.title = 'Digital Transformation Initiative'
    UNION ALL
    SELECT i.id, 'Customer feedback survey launched', jane_id
    FROM initiatives i WHERE i.title = 'Customer Experience Enhancement'
    UNION ALL
    SELECT i.id, 'Budget approval received from finance team', bob_id
    FROM initiatives i WHERE i.title = 'Cost Optimization Program'
    UNION ALL
    SELECT i.id, 'Market research phase delayed due to resource constraints', alice_id
    FROM initiatives i WHERE i.title = 'Market Expansion Strategy'
    UNION ALL
    SELECT i.id, 'Weekly status meeting scheduled for Fridays', john_id
    FROM initiatives i WHERE i.title = 'Digital Transformation Initiative';

    -- Insert achievements with proper date casting
    INSERT INTO achievements (initiative_id, title, description, type, date_achieved, created_by_id)
    SELECT i.id, 'Phase 1 Milestone', 'Successfully completed the first phase of digital transformation', 'milestone', '2024-03-15'::date, john_id
    FROM initiatives i WHERE i.title = 'Digital Transformation Initiative'
    UNION ALL
    SELECT i.id, 'Customer Survey Launch', 'Launched comprehensive customer satisfaction survey', 'achievement', '2024-03-01'::date, jane_id
    FROM initiatives i WHERE i.title = 'Customer Experience Enhancement'
    UNION ALL
    SELECT i.id, 'Budget Optimization', 'Identified 10% cost savings in Q1', 'achievement', '2024-03-31'::date, bob_id
    FROM initiatives i WHERE i.title = 'Cost Optimization Program'
    UNION ALL
    SELECT i.id, 'Market Analysis Complete', 'Completed initial market analysis for target regions', 'milestone', '2024-05-15'::date, alice_id
    FROM initiatives i WHERE i.title = 'Market Expansion Strategy';

    -- Insert executive summaries
    INSERT INTO executive_summaries (title, content, summary_date, created_by_id) VALUES
        ('Q2 2024 Executive Summary', 'Overall progress is on track with 3 out of 4 major initiatives meeting their targets. Digital transformation showing strong progress at 75% completion.', '2024-06-30'::date, jane_id),
        ('July 2024 Monthly Update', 'Customer experience initiative requires immediate attention due to resource constraints. Recommend additional budget allocation.', '2024-07-31'::date, john_id);
END $$;

-- Insert navigation settings
INSERT INTO navigation_settings (item_key, item_label, is_visible, sort_order) VALUES
    ('dashboard', 'Dashboard', true, 1),
    ('initiatives', 'Initiatives', true, 2),
    ('calendar', 'Calendar', true, 3),
    ('achievements', 'Achievements', true, 4),
    ('reports', 'Reports', true, 5),
    ('admin', 'Admin', true, 6)
ON CONFLICT (item_key) DO NOTHING;

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE initiatives ENABLE ROW LEVEL SECURITY;
ALTER TABLE notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE achievements ENABLE ROW LEVEL SECURITY;
ALTER TABLE executive_summaries ENABLE ROW LEVEL SECURITY;
ALTER TABLE navigation_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Allow all operations" ON users;
DROP POLICY IF EXISTS "Allow all operations" ON initiatives;
DROP POLICY IF EXISTS "Allow all operations" ON notes;
DROP POLICY IF EXISTS "Allow all operations" ON achievements;
DROP POLICY IF EXISTS "Allow all operations" ON executive_summaries;
DROP POLICY IF EXISTS "Allow all operations" ON navigation_settings;

-- Create policies (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations" ON users FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON initiatives FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON notes FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON achievements FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON executive_summaries FOR ALL USING (true);
CREATE POLICY "Allow all operations" ON navigation_settings FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_initiatives_status ON initiatives(status);
CREATE INDEX IF NOT EXISTS idx_initiatives_priority ON initiatives(priority);
CREATE INDEX IF NOT EXISTS idx_initiatives_owner ON initiatives(owner_id);
CREATE INDEX IF NOT EXISTS idx_notes_initiative ON notes(initiative_id);
CREATE INDEX IF NOT EXISTS idx_achievements_initiative ON achievements(initiative_id);
CREATE INDEX IF NOT EXISTS idx_achievements_date ON achievements(date_achieved);
CREATE INDEX IF NOT EXISTS idx_navigation_settings_visible ON navigation_settings(is_visible, sort_order);

-- Create triggers for automatic timestamp updates
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing triggers if they exist
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
DROP TRIGGER IF EXISTS update_initiatives_updated_at ON initiatives;
DROP TRIGGER IF EXISTS update_notes_updated_at ON notes;
DROP TRIGGER IF EXISTS update_achievements_updated_at ON achievements;
DROP TRIGGER IF EXISTS update_executive_summaries_updated_at ON executive_summaries;
DROP TRIGGER IF EXISTS update_navigation_settings_updated_at ON navigation_settings;

-- Create triggers
CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_initiatives_updated_at BEFORE UPDATE ON initiatives
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_notes_updated_at BEFORE UPDATE ON notes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_achievements_updated_at BEFORE UPDATE ON achievements
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_executive_summaries_updated_at BEFORE UPDATE ON executive_summaries
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_navigation_settings_updated_at BEFORE UPDATE ON navigation_settings
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
