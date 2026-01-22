
DO $$
DECLARE
  new_user_id uuid := '00000000-0000-0000-0000-000000000010';
BEGIN
  -- 1. Ensure User exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = 'julio10@gmail.com') THEN
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
      aud
    ) VALUES (
      new_user_id,
      '00000000-0000-0000-0000-000000000000',
      'julio10@gmail.com',
      crypt('123456', gen_salt('bf')),
      now(),
      '{"provider": "email", "providers": ["email"]}',
      '{"name": "Julio"}',
      now(),
      now(),
      'authenticated',
      'authenticated'
    );
  END IF;

  -- 2. Ensure Profile exists and is ADMIN
  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    job_title,
    avatar_url
  ) VALUES (
    new_user_id,
    'Julio Admin',
    'julio10@gmail.com',
    'ADMIN',
    'Dono',
    'https://github.com/shadcn.png'
  ) ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = 'julio10@gmail.com';

END $$;
