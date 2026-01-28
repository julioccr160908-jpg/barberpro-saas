-- Allow users to view their own profile
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
TO authenticated
USING (auth.uid() = id);

-- Allow Super Admin to view ALL profiles
DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;
CREATE POLICY "Super Admin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  )
);

-- Note: We need to avoid infinite recursion in the Super Admin policy if it queries profiles itself
-- However, for simple "view own profile", the first policy covers the Super Admin viewing themselves.
-- The second policy checks "role = SUPER_ADMIN", which acts on the ROW being checked? No.
-- It checks the auth.uid()'s role.
-- To be safe and avoid recursion, we can rely on "Users can view own profile" for the initial login check.
-- But for the "Admin Staff Manager" etc, Super Admin needs to see others.
-- The recursion happens if the policy query "SELECT 1 FROM profiles" triggers the policy again.
-- Supabase/Postgres RLS is susceptible to this.
-- A common workaround is using a function or JWT claim, OR `security_invoker`.
-- But for now, let's keep it simple. If recursion happens, we'll see a stack depth error.
-- To prevent recursion: The subquery `FROM public.profiles` inside the USING clause will trigger a SELECT policy check.
-- If that check uses the SAME policy, BOOM.
-- FIX: Create a "bypass" policy or use a function that is SECURITY DEFINER to check the role.

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
  );
END;
$$;

DROP POLICY IF EXISTS "Super Admin can view all profiles" ON public.profiles;
CREATE POLICY "Super Admin can view all profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (public.is_super_admin());
