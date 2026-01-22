-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL, -- URL friendly name (e.g. 'barbearia-do-ze')
    owner_id UUID REFERENCES auth.users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
    plan_type TEXT DEFAULT 'basic'
);

-- Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 2. Create Default Organization (Migration Helper)
-- We need to assign existing data to a 'Default' organization so it doesn't get lost.
-- This block will only run if there are no organizations yet.
DO $$
DECLARE
    v_default_org_id UUID;
    v_admin_id UUID;
BEGIN
    -- Try to find the main admin to be the owner
    SELECT id INTO v_admin_id FROM auth.users ORDER BY created_at ASC LIMIT 1;
    
    IF NOT EXISTS (SELECT 1 FROM public.organizations) THEN
        INSERT INTO public.organizations (name, slug, owner_id, subscription_status)
        VALUES ('Minha Barbearia', 'default', v_admin_id, 'active')
        RETURNING id INTO v_default_org_id;
        
        RAISE NOTICE 'Created default organization with ID: %', v_default_org_id;
    ELSE
        SELECT id INTO v_default_org_id FROM public.organizations LIMIT 1;
    END IF;

    -- 3. Add organization_id to existing tables
    -- PROFILES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'organization_id') THEN
        ALTER TABLE public.profiles ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        -- Update existing rows
        UPDATE public.profiles SET organization_id = v_default_org_id WHERE organization_id IS NULL;
    END IF;

    -- SERVICES
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'services' AND column_name = 'organization_id') THEN
        ALTER TABLE public.services ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.services SET organization_id = v_default_org_id WHERE organization_id IS NULL;
    END IF;

    -- APPOINTMENTS
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'organization_id') THEN
        ALTER TABLE public.appointments ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.appointments SET organization_id = v_default_org_id WHERE organization_id IS NULL;
    END IF;
    
    -- SETTINGS (Need to rethink settings, usually 1 row per org)
    -- Check if settings has organization_id
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'settings' AND column_name = 'organization_id') THEN
        ALTER TABLE public.settings ADD COLUMN organization_id UUID REFERENCES public.organizations(id);
        UPDATE public.settings SET organization_id = v_default_org_id WHERE organization_id IS NULL;
        
        -- Remove the constraint that forces ID=1 if we want multiple settings rows
        ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS single_row;
    END IF;

END $$;

-- 4. Minimal RLS Policies (Draft)
-- These allow access only if the user belongs to the organization (or for now, public if just testing logic)
-- CAUTION: For strict SaaS, we need a table linking Users <-> Co-Owners/Staff of an Org.
-- For now, we assume implicit ownership or simple model.

-- (Policies would be added here in a real deployment)
