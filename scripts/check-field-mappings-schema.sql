-- Check the actual structure of field_mappings table
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'field_mappings' 
ORDER BY ordinal_position;

-- Also check if there are any existing records
SELECT COUNT(*) as total_records FROM field_mappings;

-- Check a sample record to see the actual column names
SELECT * FROM field_mappings LIMIT 1;
