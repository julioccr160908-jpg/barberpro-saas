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
  '00000000-0000-0000-0000-000000000099',
  '00000000-0000-0000-0000-000000000000',
  'dono1@gmail.com',
  crypt('123456', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Dono Teste"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Create Identity
INSERT INTO auth.identities (
  id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email
) VALUES (
  '00000000-0000-0000-0000-000000000099', 
  '00000000-0000-0000-0000-000000000099', 
  jsonb_build_object('sub', '00000000-0000-0000-0000-000000000099', 'email', 'dono1@gmail.com'), 
  'email', 
  '00000000-0000-0000-0000-000000000099', 
  now(), now(), now(), 
  'dono1@gmail.com'
) ON CONFLICT (provider_id, provider) DO NOTHING;

-- Create Profile (assuming organization_id column might NOT exist if migration skipped, checking)
-- We'll try INSERT without organization_id first. If it fails, we know we missed migration.
-- But wait, I plan to run Organization migration first.
-- So I should include logic to CREATE organization if needed.

-- Create default organization for Dono1
INSERT INTO public.organizations (id, name, slug, owner_id, subscription_status, plan_type)
VALUES (
  '00000000-0000-0000-0000-000000000011',
  'Barbearia Dono1',
  'barbearia-dono1',
  '00000000-0000-0000-0000-000000000099',
  'active',
  'pro'
) ON CONFLICT DO NOTHING;

-- Create Profile linked to Org
INSERT INTO public.profiles (
  id,
  name,
  email,
  role,
  job_title,
  avatar_url,
  organization_id
) VALUES (
  '00000000-0000-0000-0000-000000000099',
  'Dono Teste',
  'dono1@gmail.com',
  'ADMIN', -- Using confirmed valid enum value
  'Dono',
  'https://github.com/shadcn.png',
  '00000000-0000-0000-0000-000000000011'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role;
