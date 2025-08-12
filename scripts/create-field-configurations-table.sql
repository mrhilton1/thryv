-- Create field_configurations table for managing form field requirements and defaults
CREATE TABLE IF NOT EXISTS field_configurations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    field_name TEXT NOT NULL,
    form_type TEXT NOT NULL DEFAULT 'initiative',
    section_name TEXT NOT NULL,
    display_label TEXT NOT NULL,
    field_type TEXT NOT NULL CHECK (field_type IN ('text', 'textarea', 'select', 'number', 'date', 'boolean')),
    is_required BOOLEAN DEFAULT false,
    has_default BOOLEAN DEFAULT false,
    default_value TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_by_id UUID REFERENCES users(id),
    UNIQUE(field_name, form_type)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_field_configurations_form_section ON field_configurations(form_type, section_name, sort_order);

-- Insert default field configurations for initiative form
INSERT INTO field_configurations (field_name, form_type, section_name, display_label, field_type, is_required, sort_order) VALUES
-- Basic Information Section
('title', 'initiative', 'basic_information', 'Initiative Title', 'text', true, 1),
('description', 'initiative', 'basic_information', 'Project Description', 'textarea', true, 2),
('goal', 'initiative', 'basic_information', 'Goal', 'textarea', true, 3),
('executiveUpdate', 'initiative', 'basic_information', 'Executive Update', 'textarea', false, 4),
('productArea', 'initiative', 'basic_information', 'Product Area', 'select', true, 5),
('ownerId', 'initiative', 'basic_information', 'Initiative Owner', 'select', true, 6),
('team', 'initiative', 'basic_information', 'Team', 'select', true, 7),
('tier', 'initiative', 'basic_information', 'Tier', 'select', false, 8),

-- Status & Progress Section
('status', 'initiative', 'status_progress', 'Status', 'select', false, 1),
('processStage', 'initiative', 'status_progress', 'Process Stage', 'select', false, 2),
('priority', 'initiative', 'status_progress', 'Priority', 'select', false, 3),
('businessImpact', 'initiative', 'status_progress', 'Business Impact', 'select', false, 4),
('progress', 'initiative', 'status_progress', 'Progress', 'number', false, 5),
('reasonIfNotOnTrack', 'initiative', 'status_progress', 'Reason if not on track', 'textarea', false, 6),

-- Timeline & Dates Section
('startDate', 'initiative', 'timeline_dates', 'Start Date', 'date', false, 1),
('estimatedReleaseDate', 'initiative', 'timeline_dates', 'Estimated Release Date', 'date', false, 2),
('actualReleaseDate', 'initiative', 'timeline_dates', 'Actual Release Date', 'date', false, 3),
('estimatedGtmType', 'initiative', 'timeline_dates', 'GTM Type', 'select', false, 4),

-- Additional Details Section
('tags', 'initiative', 'additional_details', 'Tags', 'text', false, 1)

ON CONFLICT (field_name, form_type) DO NOTHING;

-- Create trigger for automatic timestamp updates
CREATE TRIGGER update_field_configurations_updated_at 
    BEFORE UPDATE ON field_configurations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE field_configurations ENABLE ROW LEVEL SECURITY;

-- Create policy (allow all for now - you can restrict later)
CREATE POLICY "Allow all operations" ON field_configurations FOR ALL USING (true);
