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
    'julioccr1609@gmail.com',
    crypt('Julioccr2020', gen_salt('bf')),
    now(),
    now(),
    now(),
    '{"provider":"email","providers":["email"]}',
    '{"name":"Julio Admin"}',
    now(),
    now(),
    '',
    '',
    '',
    ''
);

-- 2. Update Profile to SUPER_ADMIN
DO $$
DECLARE
    v_user_id UUID;
    v_org_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'julioccr1609@gmail.com';
    SELECT id INTO v_org_id FROM public.organizations WHERE slug = 'barberpro-demo';

    -- Update profile
    UPDATE public.profiles
    SET 
        role = 'SUPER_ADMIN',
        organization_id = v_org_id -- Link to demo org so he has a context
    WHERE id = v_user_id;
    
END $$;
