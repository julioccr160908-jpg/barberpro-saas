-- Promote to Super Admin
UPDATE auth.users 
SET is_super_admin = TRUE,
    role = 'service_role', -- Sometimes needed for higher privs, but 'authenticated' with is_super_admin=true often enough. keeping authenticated but updating metadata
    raw_user_meta_data = jsonb_set(raw_user_meta_data, '{role}', '"SUPER_ADMIN"') 
WHERE email = 'julioccr1609@gmail.com';

UPDATE public.profiles
SET role = 'SUPER_ADMIN'
WHERE email = 'julioccr1609@gmail.com';
