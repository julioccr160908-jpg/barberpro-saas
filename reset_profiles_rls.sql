-- Clean up policies
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- 1. Users can view their own profile (Most important for login)
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- 2. Super Admins can do everything
CREATE POLICY "Super Admins can do everything"
ON public.profiles
FOR ALL
TO authenticated
USING (public.is_super_admin());

-- 3. Update permissions
GRANT SELECT, UPDATE, INSERT ON public.profiles TO authenticated;
GRANT SELECT, UPDATE, INSERT ON public.profiles TO service_role;

-- Grant usage on sequence if any (uuid doesn't use sequence usually but good practice)
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO anon;
