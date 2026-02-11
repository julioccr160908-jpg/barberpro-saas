
-- Fix missing phone column in profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone text;

-- Drop restrictive constraint on notification_templates if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.table_constraints 
        WHERE constraint_name = 'notification_templates_type_check' 
        AND table_name = 'notification_templates'
    ) THEN
        ALTER TABLE public.notification_templates DROP CONSTRAINT notification_templates_type_check;
    END IF;
END $$;
