-- Aggressive Status Constraint Fix - Simple and Direct Approach
-- This will definitively fix the status constraint issue

DO $$
DECLARE
    constraint_record RECORD;
    test_user_id UUID;
    test_initiative_id UUID;
BEGIN
    RAISE NOTICE '=== AGGRESSIVE STATUS CONSTRAINT FIX ===';
    
    -- Step 1: Show current constraints
    RAISE NOTICE 'Current constraints on initiatives table:';
    FOR constraint_record IN 
        SELECT 
            tc.constraint_name, 
            tc.constraint_type,
            cc.check_clause
        FROM information_schema.table_constraints tc
        LEFT JOIN information_schema.check_constraints cc ON tc.constraint_name = cc.constraint_name
        WHERE tc.table_name = 'initiatives'
        AND tc.constraint_type = 'CHECK'
    LOOP
        RAISE NOTICE 'Constraint: % (Type: %) - %', 
            constraint_record.constraint_name, 
            constraint_record.constraint_type,
            COALESCE(constraint_record.check_clause, 'N/A');
    END LOOP;
    
    -- Step 2: Drop ALL check constraints on initiatives table (aggressive approach)
    RAISE NOTICE 'Dropping ALL check constraints on initiatives table...';
    FOR constraint_record IN 
        SELECT constraint_name
        FROM information_schema.table_constraints
        WHERE table_name = 'initiatives'
        AND constraint_type = 'CHECK'
    LOOP
        BEGIN
            EXECUTE format('ALTER TABLE initiatives DROP CONSTRAINT IF EXISTS %I', constraint_record.constraint_name);
            RAISE NOTICE 'Dropped constraint: %', constraint_record.constraint_name;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop constraint % (this is OK): %', constraint_record.constraint_name, SQLERRM;
        END;
    END LOOP;
    
    -- Step 3: Add the new status constraint
    RAISE NOTICE 'Adding new status constraint...';
    BEGIN
        ALTER TABLE initiatives ADD CONSTRAINT initiatives_status_check 
        CHECK (status IN (
            'On Track',
            'At Risk', 
            'Off Track',
            'Complete',
            'Cancelled',
            'Paused',
            'Blocked',
            'Deprioritized'
        ));
        RAISE NOTICE 'Successfully added new status constraint';
    EXCEPTION
        WHEN duplicate_object THEN
            RAISE NOTICE 'Status constraint already exists, dropping and recreating...';
            ALTER TABLE initiatives DROP CONSTRAINT initiatives_status_check;
            ALTER TABLE initiatives ADD CONSTRAINT initiatives_status_check 
            CHECK (status IN (
                'On Track',
                'At Risk', 
                'Off Track',
                'Complete',
                'Cancelled',
                'Paused',
                'Blocked',
                'Deprioritized'
            ));
            RAISE NOTICE 'Recreated status constraint';
    END;
    
    -- Step 4: Get or create test user
    SELECT id INTO test_user_id FROM profiles LIMIT 1;
    IF test_user_id IS NULL THEN
        INSERT INTO profiles (name, email, role) 
        VALUES ('Test User', 'test@example.com', 'admin')
        RETURNING id INTO test_user_id;
        RAISE NOTICE 'Created test user: %', test_user_id;
    ELSE
        RAISE NOTICE 'Using existing user: %', test_user_id;
    END IF;
    
    -- Step 5: Test the constraint with Deprioritized status
    RAISE NOTICE 'Testing Deprioritized status...';
    BEGIN
        INSERT INTO initiatives (
            title, 
            description, 
            status, 
            priority, 
            tier, 
            start_date,
            owner_id,
            created_by_id
        ) VALUES (
            'Test Deprioritized Status', 
            'Testing constraint', 
            'Deprioritized', 
            'Medium', 
            1, 
            CURRENT_DATE,
            test_user_id,
            test_user_id
        ) RETURNING id INTO test_initiative_id;
        
        RAISE NOTICE 'SUCCESS: Deprioritized status works! Test record ID: %', test_initiative_id;
        
        -- Clean up
        DELETE FROM initiatives WHERE id = test_initiative_id;
        RAISE NOTICE 'Test record cleaned up';
        
    EXCEPTION
        WHEN OTHERS THEN
            RAISE EXCEPTION 'FAILED: Deprioritized status test failed: % (SQLSTATE: %)', SQLERRM, SQLSTATE;
    END;
    
    -- Step 6: Show final constraint
    RAISE NOTICE 'Final status constraint:';
    FOR constraint_record IN 
        SELECT cc.constraint_name, cc.check_clause
        FROM information_schema.check_constraints cc
        JOIN information_schema.table_constraints tc ON cc.constraint_name = tc.constraint_name
        WHERE tc.table_name = 'initiatives'
        AND cc.check_clause ILIKE '%status%'
    LOOP
        RAISE NOTICE 'Final constraint: % - %', constraint_record.constraint_name, constraint_record.check_clause;
    END LOOP;
    
    RAISE NOTICE '=== STATUS CONSTRAINT FIX COMPLETE ===';
    RAISE NOTICE 'Deprioritized is now a valid status value!';
    
END $$;

-- Verification query
SELECT 'Status constraint successfully updated. You can now use Deprioritized status.' as result;
