
-- 1. Create ADMIN user (Julio)
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000001609'; -- use fixed UUID for consistency
  v_email TEXT := 'julio1609@gmail.com'; -- Fixed email per screenshot
  v_password TEXT := 'Julioccr2020';
BEGIN
  -- Check if user exists by email to avoid duplicates
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
      ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', v_email, 
        crypt(v_password, gen_salt('bf')), now(), 
        '{"provider": "email", "providers": ["email"]}', '{"name": "Julio Admin", "role": "admin"}', 
        now(), now(), 'authenticated', 'authenticated'
      );
  END IF;

  -- 2. Ensure profile exists and is ADMIN
  -- Upsert profile
  INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url)
  VALUES (
    v_user_id, 
    'Julio Admin', 
    v_email, 
    'ADMIN', 
    'Proprietário',
    'https://ui.shadcn.com/avatars/01.png'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = EXCLUDED.email;
    
  -- 3. Ensure identity exists
  INSERT INTO auth.identities (
    id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at, email
  ) VALUES (
    v_user_id, v_user_id, jsonb_build_object('sub', v_user_id, 'email', v_email), 'email', v_user_id::text, now(), now(), now(), v_email
  ) ON CONFLICT (provider_id, provider) DO UPDATE SET
    email = EXCLUDED.email;

END $$;


-- 2. ADMIN: admin@barberpro.com (Secondary Admin)
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000002'; 
  v_email TEXT := 'admin@barberpro.com';
  v_password TEXT := 'admin123';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
      ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', v_email, 
        crypt(v_password, gen_salt('bf')), now(), 
        '{"provider": "email", "providers": ["email"]}', '{"name": "Admin Principal"}', 
        now(), now(), 'authenticated', 'authenticated'
      );
  END IF;

  INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url)
  VALUES (
    v_user_id, 
    'Admin Principal', 
    v_email, 
    'ADMIN', 
    'Administrador',
    'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?q=80&w=200&auto=format&fit=crop'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'ADMIN',
    email = EXCLUDED.email;
END $$;


-- 3. BARBER: barbeiro@barberpro.com
DO $$
DECLARE
  v_user_id UUID := '00000000-0000-0000-0000-000000000003'; 
  v_email TEXT := 'barbeiro@barberpro.com';
  v_password TEXT := 'barber123';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_email) THEN
      INSERT INTO auth.users (
        id, instance_id, email, encrypted_password, email_confirmed_at, 
        raw_app_meta_data, raw_user_meta_data, created_at, updated_at, role, aud
      ) VALUES (
        v_user_id, '00000000-0000-0000-0000-000000000000', v_email, 
        crypt(v_password, gen_salt('bf')), now(), 
        '{"provider": "email", "providers": ["email"]}', '{"name": "Barbeiro Teste"}', 
        now(), now(), 'authenticated', 'authenticated'
      );
  END IF;

  INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url)
  VALUES (
    v_user_id, 
    'João Silva', 
    v_email, 
    'BARBER', 
    'Barbeiro Sênior',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?q=80&w=200&auto=format&fit=crop'
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'BARBER',
    email = EXCLUDED.email;
END $$;

-- 4. SERVIÇOS PADRÃO
INSERT INTO public.services (name, price, duration_minutes, description)
VALUES 
('Corte de Cabelo', 35.00, 30, 'Corte tradicional ou moderno com acabamento e lavagem.'),
('Barba', 25.00, 30, 'Barba modelada com toalha quente e balm.'),
('Combo (Corte + Barba)', 55.00, 50, 'Pacote completo de corte e barba com desconto.'),
('Pezinho / Acabamento', 15.00, 15, 'Apenas o acabamento e contorno.'),
('Sobrancelha', 10.00, 10, 'Design de sobrancelha na navalha ou pinça.');

-- 5. CONFIGURAÇÕES DA BARBEARIA (Horários)
-- Remove settings anteriores para evitar duplicidade
DELETE FROM public.settings WHERE id = 1;

INSERT INTO public.settings (
  id, 
  interval_minutes, 
  schedule,
  establishment_name,
  address,
  phone,
  city,
  state,
  zip_code
) VALUES (
  1,
  30, -- Intervalo de 30 min
  json_build_array(
    json_build_object('dayId', 0, 'isOpen', false, 'openTime', '09:00', 'closeTime', '18:00'), -- Dom (Fechado)
    json_build_object('dayId', 1, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Seg
    json_build_object('dayId', 2, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Ter
    json_build_object('dayId', 3, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Qua
    json_build_object('dayId', 4, 'isOpen', true, 'openTime', '09:00', 'closeTime', '19:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Qui
    json_build_object('dayId', 5, 'isOpen', true, 'openTime', '09:00', 'closeTime', '20:00', 'breakStart', '12:00', 'breakEnd', '13:00'), -- Sex
    json_build_object('dayId', 6, 'isOpen', true, 'openTime', '08:00', 'closeTime', '18:00', 'breakStart', '12:00', 'breakEnd', '12:30')  -- Sab
  )::jsonb,
  'BarberPro SaaS',
  'Rua Exemplo, 123 - Centro',
  '(11) 99999-9999',
  'Cidade Exemplo',
  'SP',
  '00000-000'
);
