
-- Add Loyalty Columns
DO $$
BEGIN
    -- Update profiles
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'loyalty_count') THEN
        ALTER TABLE public.profiles ADD COLUMN loyalty_count INTEGER DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'loyalty_history') THEN
        ALTER TABLE public.profiles ADD COLUMN loyalty_history JSONB DEFAULT '[]'::jsonb;
    END IF;

    -- Update settings
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'loyalty_enabled') THEN
        ALTER TABLE public.settings ADD COLUMN loyalty_enabled BOOLEAN DEFAULT false;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'loyalty_target') THEN
        ALTER TABLE public.settings ADD COLUMN loyalty_target INTEGER DEFAULT 10;
    END IF;
END $$;
