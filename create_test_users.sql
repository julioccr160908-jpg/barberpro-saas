-- Script para criar usuário de teste admin no auth.users

-- IMPORTANTE: Este script usa a função interna do Supabase Auth para criar usuários
-- Senha: admin123 (alterada em produção!)

-- Limpar usuários de teste existentes (opcional)
DELETE FROM auth.users WHERE email = 'admin@barberpro.com';
DELETE FROM profiles WHERE email = 'admin@barberpro.com';

-- Criar usuário admin no Auth
-- Nota: O hash abaixo é para a senha "admin123"
-- Gerado com: SELECT crypt('admin123', gen_salt('bf'));
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
  '00000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000000',
  'admin@barberpro.com',
  crypt('admin123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Admin"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

-- Criar perfil correspondente
INSERT INTO profiles (
  id,
  name,
  email,
  role,
  job_title,
  avatar_url
) VALUES (
  '00000000-0000-0000-0000-000000000001',
  'Admin Principal',
  'admin@barberpro.com',
  'ADMIN',
  'Administrador',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  job_title = EXCLUDED.job_title;

-- Criar usuário barbeiro de teste
DELETE FROM auth.users WHERE email = 'barbeiro@barberpro.com';
DELETE FROM profiles WHERE email = 'barbeiro@barberpro.com';

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
  '00000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000000',
  'barbeiro@barberpro.com',
  crypt('barber123', gen_salt('bf')),
  now(),
  '{"provider": "email", "providers": ["email"]}',
  '{"name": "Barbeiro Teste"}',
  now(),
  now(),
  'authenticated',
  'authenticated'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO profiles (
  id,
  name,
  email,
  role,
  job_title,
  avatar_url
) VALUES (
  '00000000-0000-0000-0000-000000000002',
  'João Silva',
  'barbeiro@barberpro.com',
  'BARBER',
  'Barbeiro Sênior',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
) ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  email = EXCLUDED.email,
  role = EXCLUDED.role,
  job_title = EXCLUDED.job_title;

-- Mostrar os usuários criados
SELECT 'Usuários de teste criados!' as status;
SELECT id, email, role FROM profiles WHERE email IN ('admin@barberpro.com', 'barbeiro@barberpro.com');
