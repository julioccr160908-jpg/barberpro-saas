-- Enable RLS on Organizations (already done but good to reinforce)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- POLICY: Users can view their own organization
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

-- POLICY: Super Admins can view ALL organizations
-- (Assuming we have a way to identify Super Admin, typically via metadata or a special flag. 
-- For now, if role is 'SUPER_ADMIN' in profile)
CREATE POLICY "Super Admins can view all organizations"
ON public.organizations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
);

-- UPDATING PROFILES POLICIES
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING ( id = auth.uid() );

-- UPDATING APPOINTMENTS POLICIES
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view appointments in their organization"
ON public.appointments
FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins/Barbers can insert/update appointments in their organization"
ON public.appointments
FOR ALL
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND (
        EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('ADMIN', 'BARBER'))
        OR
        customer_id = auth.uid() -- Customers can touch their own maybe? usually just select.
    )
);

-- UPDATING SERVICES POLICIES
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view services in their organization"
ON public.services
FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
);

CREATE POLICY "Admins can manage services"
ON public.services
FOR ALL
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    AND EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'ADMIN')
);
