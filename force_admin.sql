
-- Update specific user if exists
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE email = 'julioccr1609@gmail.com';

-- Just to be sure, let's update any user that has 'Admin' in their name
UPDATE public.profiles 
SET role = 'ADMIN' 
WHERE name LIKE '%Admin%';

-- Verifica o resultado
SELECT * FROM public.profiles;
