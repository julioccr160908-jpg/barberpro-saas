-- 1. Restore SUPER_ADMIN for main accounts
UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE email IN ('julioccr1609@gmail.com', 'julio1609@gmail.com');

-- 2. Ensure anyone who OWNS an organization is at least an ADMIN
-- This fixes the case where the registration RPC might have failed the role update
UPDATE public.profiles
SET role = 'ADMIN'
WHERE id IN (
    SELECT owner_id FROM public.organizations
) AND role = 'CUSTOMER';

-- 3. Verify the changes (Output for debugging)
SELECT email, role, organization_id FROM public.profiles WHERE role IN ('SUPER_ADMIN', 'ADMIN');
