-- 1. Update Enum
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'SUPER_ADMIN';

-- 2. Organizations RLS
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own organization" ON public.organizations;
CREATE POLICY "Users can view their own organization"
ON public.organizations
FOR SELECT
USING (
    id IN (
        SELECT organization_id FROM public.profiles WHERE id = auth.uid()
    )
);

DROP POLICY IF EXISTS "Super Admins can view all organizations" ON public.organizations;
CREATE POLICY "Super Admins can view all organizations"
ON public.organizations
FOR ALL
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
);

-- 3. Profiles RLS
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile." ON public.profiles;
-- Drop potentially conflicting policies from previous attempts
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;

CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid()) 
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

CREATE POLICY "Users can update their own profile"
ON public.profiles
FOR UPDATE
USING ( id = auth.uid() );

-- 4. Appointments RLS
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
DROP POLICY IF EXISTS "Admins/Barbers can insert/update appointments in their organization" ON public.appointments;

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
        customer_id = auth.uid()
    )
);

-- 5. Services RLS
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users can view services in their organization" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

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
