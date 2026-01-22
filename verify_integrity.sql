
-- Verify Database Integrity

-- 1. Check Auth Users
SELECT count(*) as auth_users_count FROM auth.users;
SELECT id, email, created_at, last_sign_in_at FROM auth.users WHERE email = 'admin@barberpro.com';

-- 2. Check Profiles
SELECT count(*) as profiles_count FROM public.profiles;
SELECT * FROM public.profiles WHERE email = 'admin@barberpro.com';

-- 3. Check Barbershops
SELECT count(*) as barbershops_count FROM public.barbershops;
SELECT * FROM public.barbershops LIMIT 1;

-- 4. Check Professionals
SELECT count(*) as professionals_count FROM public.professionals;

-- 5. Check Services
SELECT count(*) as services_count FROM public.services;

-- 6. Check Appointments
SELECT count(*) as appointments_count FROM public.appointments;
