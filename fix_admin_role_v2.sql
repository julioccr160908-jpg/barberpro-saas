-- Ensure Profile Exists
INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url)
SELECT 
  id,
  'Admin Principal',
  email,
  'ADMIN',
  'Administrador',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
FROM auth.users 
WHERE email = 'admin@barberpro.com'
ON CONFLICT (id) DO UPDATE SET
  role = 'ADMIN',
  name = 'Admin Principal';

-- Update Auth Metadata just in case
UPDATE auth.users 
SET raw_user_meta_data = 
  CASE 
    WHEN raw_user_meta_data IS NULL THEN '{"role": "ADMIN"}'::jsonb
    ELSE jsonb_set(raw_user_meta_data, '{role}', '"ADMIN"')
  END
WHERE email = 'admin@barberpro.com';

-- Verify
SELECT * FROM public.profiles WHERE email = 'admin@barberpro.com';
