-- Create User dono3@gmail.com - FIXED VERSION
-- (profiles table does not have updated_at column)

BEGIN;

DO $$
DECLARE
  v_user_id UUID := gen_random_uuid();
  v_org_id UUID := gen_random_uuid();
  v_email TEXT := 'dono3@gmail.com';
  v_password TEXT := '123456';
BEGIN

  -- 1. Create auth.user
  INSERT INTO auth.users (
    id,
    instance_id,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_user_meta_data,
    created_at,
    updated_at,
    role,
    aud,
    confirmation_token
  ) VALUES (
    v_user_id,
    '00000000-0000-0000-0000-000000000000',
    v_email,
    crypt(v_password, gen_salt('bf')),
    now(),
    jsonb_build_object('name', 'Dono 3'),
    now(),
    now(),
    'authenticated',
    'authenticated',
    ''
  );

  -- 2. Create auth.identity
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
    jsonb_build_object('sub', v_user_id, 'email', v_email),
    'email',
    v_user_id,
    now(),
    now(),
    now()
  );

  -- 3. Create Organization (Has updated_at)
  INSERT INTO public.organizations (
    id,
    name,
    slug,
    owner_id,
    created_at,
    updated_at
  ) VALUES (
    v_org_id,
    'Barbearia Dono 3',
    'barbearia-dono-3',
    v_user_id,
    now(),
    now()
  );

  -- 4. Create Profile (NO updated_at)
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    organization_id,
    created_at
  ) VALUES (
    v_user_id,
    'Dono 3',
    v_email,
    'ADMIN',
    v_org_id,
    now()
  );

  -- 5. Create Settings for the Organization
  INSERT INTO public.settings (
    organization_id,
    schedule,
    interval_minutes
  ) VALUES (
    v_org_id,
    '[]'::jsonb,
    45
  );

  RAISE NOTICE 'User dono3 created successfully with ID % and Org ID %', v_user_id, v_org_id;

END $$;

COMMIT;
