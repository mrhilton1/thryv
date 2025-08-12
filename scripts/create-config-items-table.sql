-- Create config_items table for managing dropdown configurations
CREATE TABLE IF NOT EXISTS config_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL CHECK (category IN (
        'teams', 
        'business_impacts', 
        'product_areas', 
        'process_stages', 
        'priorities', 
        'statuses', 
        'gtm_types'
    )),
    label TEXT NOT NULL,
    color TEXT NOT NULL DEFAULT 'gray' CHECK (color IN (
        'gray', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'
    )),
    sort_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID REFERENCES users(id),
    
    -- Ensure unique labels within each category
    UNIQUE(category, label)
);

-- Create index for efficient querying
CREATE INDEX IF NOT EXISTS idx_config_items_category_order ON config_items(category, sort_order);
CREATE INDEX IF NOT EXISTS idx_config_items_active ON config_items(is_active);

-- Enable RLS
ALTER TABLE config_items ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for now - you can restrict later)
DROP POLICY IF EXISTS "Allow all operations" ON config_items;
CREATE POLICY "Allow all operations" ON config_items FOR ALL USING (true);

-- Create trigger for automatic timestamp updates
DROP TRIGGER IF EXISTS update_config_items_updated_at ON config_items;
CREATE TRIGGER update_config_items_updated_at 
    BEFORE UPDATE ON config_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
