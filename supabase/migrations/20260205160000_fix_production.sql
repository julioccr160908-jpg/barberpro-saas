
-- Fix Appointments Organization link
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'organization_id') THEN
        ALTER TABLE public.appointments ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
    END IF;
END $$;

-- Fix Profiles missing columns
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.profiles ADD COLUMN commission_rate NUMERIC DEFAULT 0;
    END IF;
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'loyalty_count') THEN
        ALTER TABLE public.profiles ADD COLUMN loyalty_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- Fix Storage
INSERT INTO storage.buckets (id, name, public) 
VALUES ('organization-assets', 'organization-assets', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- Policies for organization-assets
DROP POLICY IF EXISTS "Public Organization Assets" ON storage.objects;
CREATE POLICY "Public Organization Assets" ON storage.objects FOR SELECT USING ( bucket_id = 'organization-assets' );

DROP POLICY IF EXISTS "Authenticated Upload Assets" ON storage.objects;
CREATE POLICY "Authenticated Upload Assets" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'organization-assets' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Update Assets" ON storage.objects;
CREATE POLICY "Authenticated Update Assets" ON storage.objects FOR UPDATE USING ( bucket_id = 'organization-assets' AND auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Delete Assets" ON storage.objects;
CREATE POLICY "Authenticated Delete Assets" ON storage.objects FOR DELETE USING ( bucket_id = 'organization-assets' AND auth.role() = 'authenticated' );
