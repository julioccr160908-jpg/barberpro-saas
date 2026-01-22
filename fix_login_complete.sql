BEGIN;

-- 1. Remove dependências (agendamentos) que possam impedir a exclusão do profile
DELETE FROM public.appointments 
WHERE customer_id IN (SELECT id FROM public.profiles WHERE email = 'julioccr1609@gmail.com')
   OR barber_id IN (SELECT id FROM public.profiles WHERE email = 'julioccr1609@gmail.com');

-- 2. Remover dados do usuário antigo
DELETE FROM public.profiles WHERE email = 'julioccr1609@gmail.com';
DELETE FROM auth.identities WHERE email = 'julioccr1609@gmail.com';
DELETE FROM auth.users WHERE email = 'julioccr1609@gmail.com';

-- 3. Criar novo usuário e profile
WITH new_user AS (
  INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    recovery_sent_at,
    last_sign_in_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    '00000000-0000-0000-0000-000000000000',
    gen_random_uuid(),
    'authenticated',
    'authenticated',
    'julioccr1609@gmail.com',
    crypt('Julioccr2020', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"full_name": "Julio Owner"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
  ) RETURNING id, email
),
new_identity AS (
  INSERT INTO auth.identities (
    id, user_id, provider_id, identity_data, provider, last_sign_in_at, created_at, updated_at
  ) 
  SELECT 
    gen_random_uuid(), id, email, format('{"sub":"%s","email":"%s","email_verified": true}', id, email)::jsonb, 'email', now(), now(), now()
  FROM new_user
)
INSERT INTO public.profiles (id, email, role, job_title, name)
SELECT id, email, 'ADMIN', 'Dono', 'Julio Owner'
FROM new_user;

COMMIT;
