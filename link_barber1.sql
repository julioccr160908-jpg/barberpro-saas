
-- Link barber1 to the correct organization
UPDATE public.profiles
SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'barbearia-1' LIMIT 1)
WHERE email ILIKE '%barber1%';
