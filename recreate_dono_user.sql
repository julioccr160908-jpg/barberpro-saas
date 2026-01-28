
-- Transaction to ensure clean slate
BEGIN;

-- 1. Delete existing user and profile (Cascade should handle profile, but being explicit)
DELETE FROM public.profiles WHERE email = 'dono1@gmail.com';
DELETE FROM auth.users WHERE email = 'dono1@gmail.com';

-- 2. Insert into auth.users (Correctly formatted for Supabase Auth)
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
  '241afd39-7aad-4d5a-bb42-696fc468a29c', -- Keeping same ID for consistency if desired, or GEN_RANDOM_UUID()
  'authenticated',
  'authenticated', -- This is the postgres role, NOT our app role
  'dono1@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  '{"provider":"email","providers":["email"]}',
  '{}',
  now(),
  now(),
  '',
  '',
  '',
  ''
);

-- 3. Insert into public.profiles with correct App Role
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  avatar_url
) VALUES (
  '241afd39-7aad-4d5a-bb42-696fc468a29c',
  'Donos Barbearia',
  'dono1@gmail.com',
  'ADMIN', -- CRITICAL
  'https://api.dicebear.com/7.x/avataaars/svg?seed=Felix'
);

COMMIT;
