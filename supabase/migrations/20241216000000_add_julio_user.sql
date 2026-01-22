-- Clean up if exists (Skipped to avoid FK violations)
-- DELETE FROM auth.users WHERE email = 'julio10@gmail.com';
-- DELETE FROM profiles WHERE email = 'julio10@gmail.com';

-- Create User in Auth
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
  '00000000-0000-0000-0000-000000000010',
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
) ON CONFLICT (id) DO NOTHING;

-- Create Profile
INSERT INTO profiles (
  id,
  name,
  email,
  role,
  job_title,
  avatar_url
) VALUES (
  '00000000-0000-0000-0000-000000000010',
  'Julio Admin',
  'julio10@gmail.com',
  'ADMIN',
  'Dono',
  'https://github.com/shadcn.png'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;
