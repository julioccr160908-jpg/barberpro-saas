-- Enable Super Admin to View ALL Organizations
DROP POLICY IF EXISTS "Super Admins can do everything on organizations" ON public.organizations;

CREATE POLICY "Super Admins can do everything on organizations"
ON public.organizations
FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
)
WITH CHECK (
    EXISTS (
        SELECT 1 FROM public.profiles 
        WHERE id = auth.uid() AND role = 'SUPER_ADMIN'
    )
);

-- Ensure authenticated users can insert (checked by trigger or policy) if they are super admins
-- The above policy covers INSERT for Super Admins.

NOTIFY pgrst, 'reload schema';
