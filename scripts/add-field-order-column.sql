-- Add order column to field_configurations table for drag-and-drop reordering
ALTER TABLE field_configurations 
ADD COLUMN IF NOT EXISTS "order" INTEGER DEFAULT 0;

-- Fixed window function issue by using WITH clause and subquery
-- Update existing records to have sequential order values
WITH ordered_fields AS (
  SELECT id, 
         row_number() OVER (PARTITION BY section_name ORDER BY id) as new_order
  FROM field_configurations 
  WHERE "order" = 0 OR "order" IS NULL
)
UPDATE field_configurations 
SET "order" = ordered_fields.new_order
FROM ordered_fields
WHERE field_configurations.id = ordered_fields.id;

-- Create index for better performance on ordering queries
CREATE INDEX IF NOT EXISTS idx_field_configurations_order 
ON field_configurations(section_name, "order");
