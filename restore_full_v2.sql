-- RESTORE FULL DATABASE v2

-- 1. INITIAL SCHEMA (Profiles, Services, Appointments, Settings)
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('ADMIN', 'BARBER', 'CUSTOMER', 'SUPER_ADMIN');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE appointment_status AS ENUM ('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DROP TABLE IF EXISTS profiles CASCADE;
CREATE TABLE IF NOT EXISTS profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  role user_role DEFAULT 'CUSTOMER',
  avatar_url TEXT,
  job_title TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

DROP TABLE IF EXISTS services CASCADE;
CREATE TABLE IF NOT EXISTS services (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  price DECIMAL(10, 2) NOT NULL,
  duration_minutes INTEGER NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  active BOOLEAN DEFAULT true
);

DROP TABLE IF EXISTS appointments CASCADE;
CREATE TABLE IF NOT EXISTS appointments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  barber_id UUID REFERENCES profiles(id),
  customer_id UUID REFERENCES profiles(id),
  service_id UUID REFERENCES services(id),
  date TIMESTAMP WITH TIME ZONE NOT NULL,
  status appointment_status DEFAULT 'PENDING',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  notes TEXT
);

DROP TABLE IF EXISTS settings CASCADE;
CREATE TABLE IF NOT EXISTS settings (
  id INTEGER PRIMARY KEY DEFAULT 1,
  interval_minutes INTEGER DEFAULT 45,
  schedule JSONB NOT NULL,
  CONSTRAINT single_row CHECK (id = 1)
);

-- 2. CREATE ORGANIZATIONS TABLE
CREATE TABLE IF NOT EXISTS public.organizations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    owner_id UUID, -- Foreign key added later or loosely coupled for now to check generic auth
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    subscription_status TEXT DEFAULT 'trial',
    plan_type TEXT DEFAULT 'basic',
    -- BRANDING COLUMNS
    logo_url text,
    banner_url text,
    primary_color text,
    secondary_color text,
    theme_mode text DEFAULT 'dark'
);

-- Link tables to organization
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.appointments ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);
ALTER TABLE public.settings ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. ENABLE RLS & POLICIES (Simplified for recovery)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Access" ON profiles; DROP POLICY IF EXISTS "Public Access" ON services; DROP POLICY IF EXISTS "Public Access" ON appointments; DROP POLICY IF EXISTS "Public Access" ON settings; DROP POLICY IF EXISTS "Public Access" ON organizations;

-- Permissive policies for now
CREATE POLICY "Public Access" ON profiles FOR ALL USING (true);
CREATE POLICY "Public Access" ON services FOR ALL USING (true);
CREATE POLICY "Public Access" ON appointments FOR ALL USING (true);
CREATE POLICY "Public Access" ON settings FOR ALL USING (true);
CREATE POLICY "Public Access" ON organizations FOR ALL USING (true);

-- 4. UPDATE SETTINGS SCHEMA (Custom Columns)
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS establishment_name text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text;

-- 5. RECREATE USER (Dono1)
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    -- Delete if exists (clean start)
    -- In Supabase/GoTrue we can't delete easily via SQL, but we can check if it exists.
    -- Assuming --no-backup wiped it, so we insert.
    -- If it exists, we skip insert and just update.
    
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = 'dono1@gmail.com') THEN
        SELECT id INTO v_user_id FROM auth.users WHERE email = 'dono1@gmail.com';
    ELSE
        v_user_id := gen_random_uuid();
        INSERT INTO auth.users (id, instance_id, aud, role, email, encrypted_password, email_confirmed_at, raw_user_meta_data)
        VALUES (
            v_user_id, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated', 
            'dono1@gmail.com', crypt('123456', gen_salt('bf')), now(), '{"name":"Dono 1"}'
        );
    END IF;

    -- Create Organization
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('Barbearia Dono1', 'barbearia-dono1', v_user_id, 'active', 'basic')
    ON CONFLICT (slug) DO NOTHING;

    -- Create Profile with Admin Role
    INSERT INTO public.profiles (id, name, email, role, organization_id)
    VALUES (
        v_user_id, 'Dono 1', 'dono1@gmail.com', 'ADMIN', 
        (SELECT id FROM public.organizations WHERE slug = 'barbearia-dono1')
    )
    ON CONFLICT (id) DO UPDATE SET role = 'ADMIN', organization_id = (SELECT id FROM public.organizations WHERE slug = 'barbearia-dono1');

    -- Create Default Settings
    INSERT INTO public.settings (id, interval_minutes, schedule, establishment_name, phone)
    VALUES (
        1, 30, 
        '[{"dayId":0,"isOpen":false},{"dayId":1,"isOpen":true,"openTime":"09:00","closeTime":"18:00"}]'::jsonb,
        'Barbearia Dono1', '000000000'
    )
    ON CONFLICT (id) DO NOTHING;

END $$;

-- 6. FIX STORAGE
INSERT INTO storage.buckets (id, name, public) VALUES ('organization-assets', 'organization-assets', true) ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id = 'organization-assets' );

DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( bucket_id = 'organization-assets' AND auth.role() = 'authenticated' );
