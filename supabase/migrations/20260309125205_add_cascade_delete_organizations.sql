-- MIGRATION: 20260309125205_add_cascade_delete_organizations.sql
-- Add ON DELETE CASCADE to all foreign keys referencing organizations

DO $$ 
DECLARE 
    r RECORD;
BEGIN
    FOR r IN (
        SELECT 
            tc.table_name, 
            tc.constraint_name, 
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc
        JOIN 
            information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
        JOIN 
            information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_name = 'organizations'
    ) LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE public.%I DROP CONSTRAINT %I;', r.table_name, r.constraint_name);
        
        -- Re-add the constraint with ON DELETE CASCADE
        EXECUTE format('ALTER TABLE public.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES public.organizations(id) ON DELETE CASCADE;', 
            r.table_name, r.constraint_name, r.column_name);
    END LOOP;
END $$;
