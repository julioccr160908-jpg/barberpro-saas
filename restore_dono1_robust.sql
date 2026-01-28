-- 1. Ensure User Exists in Auth
DO $$
DECLARE
    v_user_id UUID;
BEGIN
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'dono1@gmail.com';
    
    IF v_user_id IS NULL THEN
        INSERT INTO auth.users (
            instance_id, id, aud, role, email, encrypted_password, 
            email_confirmed_at, recovery_sent_at, last_sign_in_at, 
            raw_app_meta_data, raw_user_meta_data, 
            created_at, updated_at
        ) VALUES (
            '00000000-0000-0000-0000-000000000000',
            gen_random_uuid(),
            'authenticated',
            'authenticated',
            'dono1@gmail.com',
            crypt('123456', gen_salt('bf')),
            now(), now(), now(),
            '{"provider":"email","providers":["email"]}',
            '{"name":"Dono 1"}',
            now(), now()
        ) RETURNING id INTO v_user_id;
        RAISE NOTICE 'User created with ID: %', v_user_id;
    ELSE
        -- Reset password just in case
        UPDATE auth.users 
        SET encrypted_password = crypt('123456', gen_salt('bf')) 
        WHERE id = v_user_id;
        RAISE NOTICE 'User exists, password reset. ID: %', v_user_id;
    END IF;

    -- 2. Ensure Profile Exists
    INSERT INTO public.profiles (id, email, name, role, job_title)
    VALUES (v_user_id, 'dono1@gmail.com', 'Dono 1', 'ADMIN', 'Owner')
    ON CONFLICT (id) DO UPDATE 
    SET role = 'ADMIN';

    -- 3. Ensure Organization Exists & Link
    WITH new_org AS (
        INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
        VALUES ('Barbearia Dono1', 'barbearia-dono1', v_user_id, 'pending', 'basic')
        ON CONFLICT (slug) DO UPDATE 
        SET owner_id = v_user_id
        RETURNING id
    )
    UPDATE public.profiles
    SET organization_id = (SELECT id FROM new_org)
    WHERE id = v_user_id;

    RAISE NOTICE 'Restoration complete for Dono1';
END $$;
