-- 1. Re-enable RLS (Security First)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

-- 2. Clean up existing policies to avoid conflicts/confusion
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Super Admins can do everything on organizations" ON public.organizations;
DROP POLICY IF EXISTS "Members can view their own organization" ON public.organizations;
DROP POLICY IF EXISTS "Settings are viewable by everyone" ON public.settings;

-- 3. Profiles Policies
-- Allow users to read their own profile. Crucial for AuthContext role fetching.
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow users to update their own profile
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id);

-- 4. Organizations Policies
-- Allow owners to read their organization
CREATE POLICY "Owners can view their organization"
ON public.organizations
FOR SELECT
TO authenticated
USING (owner_id = auth.uid());

-- Allow owners to update their organization
CREATE POLICY "Owners can update their organization"
ON public.organizations
FOR UPDATE
TO authenticated
USING (owner_id = auth.uid());

-- 5. Settings Policies
-- Allow authenticated users to read settings (required for app config)
CREATE POLICY "Authenticated can view settings"
ON public.settings
FOR SELECT
TO authenticated
USING (true);

-- 6. Grant basic table permissions to the authenticated role
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.organizations TO authenticated;
GRANT SELECT ON public.settings TO authenticated;

-- 7. Notify PostgREST to reload schema
NOTIFY pgrst, 'reload schema';
