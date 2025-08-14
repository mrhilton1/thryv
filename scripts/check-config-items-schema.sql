-- Check the actual structure of config_items table
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'config_items' 
AND table_schema = 'public'
ORDER BY ordinal_position;

-- Also check if there are any existing records to see the actual column names
SELECT * FROM config_items LIMIT 5;

-- Check what categories exist
SELECT DISTINCT category FROM config_items ORDER BY category;

-- Check business_impacts specifically
SELECT * FROM config_items WHERE category = 'business_impacts' ORDER BY sort_order;

-- Check gtm_types specifically  
SELECT * FROM config_items WHERE category = 'gtm_types' ORDER BY sort_order;
