-- RLS Consolidation Migration
-- This script unifies and tightens security policies for core tables.

-- 1. Profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- Select: Public (Safe for booking flow), but could be tighter. 
-- For now, allowing public read is necessary for customers to see Barbers.
CREATE POLICY "Public profiles read" ON public.profiles FOR SELECT USING (true);

-- Insert: Public (Sign Up)
CREATE POLICY "Public profiles insert" ON public.profiles FOR INSERT WITH CHECK (true);

-- Update: Self or Admin of same Org
CREATE POLICY "Files update self or org admin" ON public.profiles FOR UPDATE USING (
    auth.uid() = id OR 
    (EXISTS (
        SELECT 1 FROM public.profiles admin 
        WHERE admin.id = auth.uid() 
        AND admin.role IN ('ADMIN', 'SUPER_ADMIN')
        AND admin.organization_id = profiles.organization_id
    ))
);

-- 2. Organizations
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public read access" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated insert" ON public.organizations;
DROP POLICY IF EXISTS "Owner or Admin update" ON public.organizations;

-- Select: Public (need to resolve slugs)
CREATE POLICY "Public organizations read" ON public.organizations FOR SELECT USING (true);

-- Insert: Authenticated (Create new barbershop)
CREATE POLICY "Authenticated create org" ON public.organizations FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update: Owner or Super Admin
CREATE POLICY "Owner update org" ON public.organizations FOR UPDATE USING (
    owner_id = auth.uid() OR 
    (EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN'))
);

-- 3. Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Select: Public (Booking flow)
CREATE POLICY "Public services read" ON public.services FOR SELECT USING (true);

-- Manage: Admin of Org
CREATE POLICY "Org Admin manage services" ON public.services FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = services.organization_id
        AND profiles.role IN ('ADMIN', 'OWNER', 'SUPER_ADMIN')
    )
);

-- 4. Appointments
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Select: Self (Customer) OR Org Staff
CREATE POLICY "View own or org appointments" ON public.appointments FOR SELECT USING (
    customer_id = auth.uid() OR
    (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = appointments.organization_id
        AND profiles.role IN ('ADMIN', 'BARBER', 'SUPER_ADMIN')
    ))
);

-- Insert: Public (Booking) or Authenticated
CREATE POLICY "Insert appointments" ON public.appointments FOR INSERT WITH CHECK (true);

-- Update: Self (Cancel) or Org Staff (Status change)
CREATE POLICY "Update own or org appointments" ON public.appointments FOR UPDATE USING (
    customer_id = auth.uid() OR
    (EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE profiles.id = auth.uid() 
        AND profiles.organization_id = appointments.organization_id
        AND profiles.role IN ('ADMIN', 'BARBER', 'SUPER_ADMIN')
    ))
);

NOTIFY pgrst, 'reload schema';
