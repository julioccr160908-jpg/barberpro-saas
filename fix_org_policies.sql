
-- Helper function to check super admin status securely
CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'super_admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Enable RLS (just in case)
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public read access" ON public.organizations;
DROP POLICY IF EXISTS "Authenticated insert" ON public.organizations;
DROP POLICY IF EXISTS "Owner or Admin update" ON public.organizations;
DROP POLICY IF EXISTS "Owner or Admin delete" ON public.organizations;

-- 1. SELECT: Allow everyone to read organizations (needed for Public Booking Page + Admin List)
CREATE POLICY "Public read access" 
ON public.organizations 
FOR SELECT 
USING (true);

-- 2. INSERT: Authenticated users can create organizations
CREATE POLICY "Authenticated insert" 
ON public.organizations 
FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- 3. UPDATE: Owner OR Super Admin
CREATE POLICY "Owner or Admin update" 
ON public.organizations 
FOR UPDATE 
USING (
  auth.uid() = owner_id OR public.is_super_admin()
);

-- 4. DELETE: Owner OR Super Admin
CREATE POLICY "Owner or Admin delete" 
ON public.organizations 
FOR DELETE 
USING (
  auth.uid() = owner_id OR public.is_super_admin()
);
