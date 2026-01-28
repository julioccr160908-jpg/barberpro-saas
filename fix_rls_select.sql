ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing select policy if it exists to avoid conflict
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- Create policy
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Grant access to authenticated users
GRANT SELECT ON public.profiles TO authenticated;
