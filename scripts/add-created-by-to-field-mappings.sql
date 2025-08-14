-- Add created_by column to field_mappings table
ALTER TABLE field_mappings 
ADD COLUMN created_by_id UUID REFERENCES auth.users(id);

-- Add index for better performance
CREATE INDEX IF NOT EXISTS idx_field_mappings_created_by 
ON field_mappings(created_by_id);

-- Verify the column was added
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'field_mappings' 
AND column_name = 'created_by_id';
