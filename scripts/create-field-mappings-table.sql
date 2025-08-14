-- Create field_mappings table to store user-defined field mappings
CREATE TABLE IF NOT EXISTS field_mappings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    field_name TEXT NOT NULL,
    source_value TEXT NOT NULL,
    target_value TEXT NOT NULL,
    target_type TEXT NOT NULL CHECK (target_type IN ('existing', 'new')),
    created_by_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(field_name, source_value)
);

-- Enable RLS
ALTER TABLE field_mappings ENABLE ROW LEVEL SECURITY;

-- Create policies
DROP POLICY IF EXISTS "Users can view all field mappings" ON field_mappings;
CREATE POLICY "Users can view all field mappings" ON field_mappings
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert field mappings" ON field_mappings;
CREATE POLICY "Users can insert field mappings" ON field_mappings
    FOR INSERT WITH CHECK (auth.uid() = created_by_id);

DROP POLICY IF EXISTS "Users can update their own field mappings" ON field_mappings;
CREATE POLICY "Users can update their own field mappings" ON field_mappings
    FOR UPDATE USING (auth.uid() = created_by_id);

DROP POLICY IF EXISTS "Users can delete their own field mappings" ON field_mappings;
CREATE POLICY "Users can delete their own field mappings" ON field_mappings
    FOR DELETE USING (auth.uid() = created_by_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_field_mappings_field_name ON field_mappings(field_name);
CREATE INDEX IF NOT EXISTS idx_field_mappings_source_value ON field_mappings(source_value);
CREATE INDEX IF NOT EXISTS idx_field_mappings_created_by ON field_mappings(created_by_id);
