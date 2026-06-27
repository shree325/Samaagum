DO $$
DECLARE
    target_user_id UUID := '91fda06e-7596-45d3-a986-8864919467f5';
    r RECORD;
    cnt INT;
BEGIN
    RAISE NOTICE 'Searching for user: %', target_user_id;
    FOR r IN 
        SELECT DISTINCT
            tc.table_schema, 
            tc.table_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND ccu.table_name = 'users'
          AND ccu.column_name = 'id'
    LOOP
        BEGIN
            EXECUTE format('SELECT count(*) FROM %I.%I WHERE %I = %L', 
                r.table_schema, r.table_name, r.column_name, target_user_id) INTO cnt;
            IF cnt > 0 THEN
                RAISE NOTICE 'FOUND: Table "%" Column "%" has % records', r.table_name, r.column_name, cnt;
            END IF;
        EXCEPTION WHEN OTHERS THEN
            -- Ignore errors from unmappable tables
        END;
    END LOOP;
END $$;
