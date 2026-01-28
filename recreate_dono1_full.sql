-- 1. Create User
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
    'dono1@gmail.com',
    crypt('123456', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Dono 1"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 2. Create Profile (Trigger usually handles this, but let's ensure role is ADMIN)
-- Wait for trigger or upsert manual
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dono1@gmail.com';
    
    -- Update profile to SUPER_ADMIN/ADMIN
    UPDATE public.profiles
    SET role = 'ADMIN' 
    WHERE id = v_user_id;
    
    -- Create Organization
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('Barbearia Dono1', 'barbearia-dono1', v_user_id, 'pending', 'basic');
    
    -- Link Org to Profile
    UPDATE public.profiles
    SET organization_id = (SELECT id FROM public.organizations WHERE slug = 'barbearia-dono1')
    WHERE id = v_user_id;

END $$;
