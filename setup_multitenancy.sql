-- 1. Create Organizations Table
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID REFERENCES auth.users(id),
    subscription_status TEXT DEFAULT 'trial' CHECK (subscription_status IN ('trial', 'active', 'past_due', 'canceled')),
    plan_type TEXT DEFAULT 'basic' CHECK (plan_type IN ('basic', 'pro', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Organization ID to Profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Enable RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- 4. Policies for Organizations
-- Super Admins can do everything
CREATE POLICY "Super Admins can do everything on organizations" 
ON public.organizations 
FOR ALL 
USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- Public read for now (for dev simplicity, verify strictness later)
-- Members can read their own org
CREATE POLICY "Members can view their own organization"
ON public.organizations
FOR SELECT
USING (
    id IN (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) OR
    owner_id = auth.uid()
);

-- 5. Insert Default Organization for Super Admin if not exists
DO $$
DECLARE
    v_owner_id UUID;
    v_org_id UUID;
BEGIN
    SELECT id INTO v_owner_id FROM auth.users WHERE email = 'julio1609@gmail.com';
    
    IF v_owner_id IS NOT NULL THEN
        INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
        VALUES ('BarberPro Demo', 'barberpro-demo', v_owner_id, 'active', 'enterprise')
        ON CONFLICT (slug) DO UPDATE SET owner_id = v_owner_id
        RETURNING id INTO v_org_id;

        -- Link Profile to Org
        UPDATE public.profiles SET organization_id = v_org_id WHERE id = v_owner_id;
    END IF;
END $$;
