-- Recreate user completely with identities to fix login
BEGIN;

-- 1. DELETE EXISTING USER and related data
-- This should cascade to identities and profiles if FKs are set, but we'll do manual cleanup just in case
DELETE FROM public.profiles WHERE email = 'julioccr1609@gmail.com';
DELETE FROM auth.identities WHERE email = 'julioccr1609@gmail.com'; 
DELETE FROM auth.users WHERE email = 'julioccr1609@gmail.com';

-- 2. VARIABLES
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000001';
  v_email TEXT := 'julioccr1609@gmail.com';
  v_password TEXT := 'Julioccr2020';
  v_identity_id UUID := gen_random_uuid();
BEGIN

  -- 3. INSERT INTO auth.users
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token,
    email_change,
    email_change_token_new,
    recovery_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    crypt(v_password, gen_salt('bf')), -- Hash the password
    now(),
    '{"provider": "email", "providers": ["email"]}',
    '{"name": "Julio Admin"}',
    now(),
    now(),
    'authenticated',
    'authenticated',
    '',
    '',
    '',
    ''
  );

  -- 4. INSERT INTO auth.identities
  INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    v_user_id,
    jsonb_build_object('sub', v_user_id, 'email', v_email, 'email_verified', true, 'phone_verified', false),
    'email',
    v_user_id, -- provider_id usually matches user_id or sub for email provider
    now(),
    now(),
    now()
  );

  -- 5. INSERT INTO public.profiles
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    job_title,
    avatar_url,
    created_at
  ) VALUES (
    v_user_id,
    'Julio Admin',
    v_email,
    'ADMIN',
    'Administrador',
    'https://github.com/shadcn.png', -- User requested profile picture if possible
    now()
  );

END $$;

COMMIT;
