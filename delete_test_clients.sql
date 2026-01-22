
-- 1. Remove agendamentos dos clientes de teste
DELETE FROM public.appointments 
WHERE customer_id IN (
    SELECT id FROM public.profiles WHERE email LIKE 'cliente_teste_%'
);

-- 2. Remove perfis
DELETE FROM public.profiles 
WHERE email LIKE 'cliente_teste_%@barberpro.com';

-- 3. Remove usuários de auth
DELETE FROM auth.users 
WHERE email LIKE 'cliente_teste_%@barberpro.com';
