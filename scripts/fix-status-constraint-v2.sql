-- Fix status constraint to include "Deprioritized" and handle required fields
DO $$
DECLARE
    status_record RECORD;
    test_owner_id UUID;
    constraint_exists BOOLEAN := FALSE;
BEGIN
    -- Check if the constraint exists
    SELECT EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name = 'check_status' 
        AND table_name = 'initiatives'
    ) INTO constraint_exists;

    RAISE NOTICE 'Constraint exists: %', constraint_exists;

    -- Show current constraint if it exists
    IF constraint_exists THEN
        RAISE NOTICE 'Current constraint definition:';
        FOR status_record IN 
            SELECT constraint_name, check_clause 
            FROM information_schema.check_constraints 
            WHERE constraint_name = 'check_status'
        LOOP
            RAISE NOTICE 'Constraint: % - %', status_record.constraint_name, status_record.check_clause;
        END LOOP;
        
        -- Drop the existing constraint
        RAISE NOTICE 'Dropping existing constraint...';
        ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS check_status;
    END IF;

    -- Add the new constraint with "Deprioritized" included
    RAISE NOTICE 'Adding new constraint with Deprioritized status...';
    ALTER TABLE initiatives ADD CONSTRAINT check_status 
    CHECK (status IN ('On Track', 'At Risk', 'Off Track', 'Complete', 'Cancelled', 'Paused', 'Blocked', 'Deprioritized'));

    -- Get a test user ID (create one if needed)
    SELECT id INTO test_owner_id FROM profiles LIMIT 1;
    
    IF test_owner_id IS NULL THEN
        RAISE NOTICE 'No users found, creating test user...';
        INSERT INTO profiles (name, email, role) 
        VALUES ('Test User', 'test@example.com', 'admin') 
        RETURNING id INTO test_owner_id;
        RAISE NOTICE 'Created test user with ID: %', test_owner_id;
    ELSE
        RAISE NOTICE 'Using existing user ID: %', test_owner_id;
    END IF;

    -- Test the new constraint with a Deprioritized status
    RAISE NOTICE 'Testing new constraint with Deprioritized status...';
    INSERT INTO initiatives (
        title, 
        description, 
        status, 
        priority, 
        tier, 
        start_date, 
        estimated_release_date,
        owner_id,
        created_by_id,
        product_area,
        team,
        process_stage,
        business_impact
    ) VALUES (
        'Test Deprioritized Initiative', 
        'Test description for constraint validation', 
        'Deprioritized', 
        'Medium', 
        1, 
        CURRENT_DATE, 
        CURRENT_DATE + INTERVAL '30 days',
        test_owner_id,
        test_owner_id,
        'General',
        'Test Team',
        'Planning',
        'Test Impact'
    );

    RAISE NOTICE 'Test insert successful! Constraint is working.';

    -- Clean up test data
    DELETE FROM initiatives WHERE title = 'Test Deprioritized Initiative';
    RAISE NOTICE 'Test data cleaned up.';

    -- Show current status values in the database
    RAISE NOTICE 'Current status values in initiatives table:';
    FOR status_record IN 
        SELECT DISTINCT status FROM initiatives ORDER BY status
    LOOP
        RAISE NOTICE 'Status: %', status_record.status;
    END LOOP;

    RAISE NOTICE 'Constraint update completed successfully!';
    RAISE NOTICE 'Valid status values are now: On Track, At Risk, Off Track, Complete, Cancelled, Paused, Blocked, Deprioritized';

END $$;
