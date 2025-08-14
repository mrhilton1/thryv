-- Fix the status constraint to match the application's expected values
-- Run this in your Supabase SQL Editor

-- First, drop the existing constraint
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS check_status;

-- Add the new constraint with the correct status values (including Deprioritized)
ALTER TABLE initiatives ADD CONSTRAINT check_status 
CHECK (status IN ('On Track', 'At Risk', 'Off Track', 'Complete', 'Cancelled', 'Paused', 'Blocked', 'Deprioritized'));

-- Update any existing data that might have the old format
UPDATE initiatives 
SET status = CASE 
    WHEN status = 'on-track' THEN 'On Track'
    WHEN status = 'at-risk' THEN 'At Risk'
    WHEN status = 'off-track' THEN 'Off Track'
    WHEN status = 'complete' THEN 'Complete'
    WHEN status = 'cancelled' THEN 'Cancelled'
    WHEN status = 'paused' THEN 'Paused'
    WHEN status = 'blocked' THEN 'Blocked'
    WHEN status = 'deprioritized' THEN 'Deprioritized'
    ELSE status
END;

-- Also fix priority constraint to match application values
ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS check_priority;
ALTER TABLE initiatives ADD CONSTRAINT check_priority 
CHECK (priority IN ('Low', 'Medium', 'High', 'Critical'));

-- Update any existing priority data
UPDATE initiatives 
SET priority = CASE 
    WHEN priority = 'low' THEN 'Low'
    WHEN priority = 'medium' THEN 'Medium'
    WHEN priority = 'high' THEN 'High'
    WHEN priority = 'critical' THEN 'Critical'
    ELSE priority
END;

-- Check current data to see what we have
SELECT DISTINCT status FROM initiatives;
SELECT DISTINCT priority FROM initiatives;
