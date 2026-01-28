-- Fix Login Safely for julioccr1609@gmail.com
-- Strategy: Upsert auth.users and auth.identities. Preserve public.profiles if exists.

BEGIN;

DO $$
DECLARE
    v_email TEXT := 'julioccr1609@gmail.com';
    v_password TEXT := '123456';
    v_user_id UUID;
    v_existing_profile_id UUID;
BEGIN
    -- 1. Check for existing profile to preserve ID
    SELECT id INTO v_existing_profile_id FROM public.profiles WHERE email = v_email;

    -- 2. Check for existing auth user
    SELECT id INTO v_user_id FROM auth.users WHERE email = v_email;

    -- Logic:
    -- If user exists: Update password.
    -- If user NOT exists but Profile exists: Create user with Profile ID.
    -- If neither exists: Create new user and profile.

    IF v_user_id IS NOT NULL THEN
        RAISE NOTICE 'User exists (ID: %), updating password...', v_user_id;
        
        -- Update Password and Metadata
        UPDATE auth.users 
        SET encrypted_password = crypt(v_password, gen_salt('bf')),
            raw_user_meta_data = jsonb_build_object('name', 'Julio Admin', 'role', 'ADMIN'),
            updated_at = now()
        WHERE id = v_user_id;

        -- Ensure Identity exists
        INSERT INTO auth.identities (id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at)
        VALUES (
            gen_random_uuid(), 
            v_user_id, 
            jsonb_build_object('sub', v_user_id, 'email', v_email), 
            'email', 
            v_user_id, 
            now(), now(), now()
        )
        ON CONFLICT (provider_id, provider) DO UPDATE
        SET identity_data = jsonb_build_object('sub', v_user_id, 'email', v_email),
            last_sign_in_at = now(),
            updated_at = now();

    ELSE
        -- User does not exist
        IF v_existing_profile_id IS NOT NULL THEN
            v_user_id := v_existing_profile_id;
            RAISE NOTICE 'Profile exists (ID: %), creating auth user with same ID...', v_user_id;
        ELSE
            v_user_id := gen_random_uuid();
            RAISE NOTICE 'No user or profile, creating new ID: %...', v_user_id;
        END IF;

        -- Insert Auth User
        INSERT INTO auth.users (
            id, instance_id, email, encrypted_password, email_confirmed_at, 
            raw_app_meta_data, raw_user_meta_data, created_at, updated_at, 
            role, aud, is_super_admin
        ) VALUES (
            v_user_id, 
            '00000000-0000-0000-0000-000000000000', 
            v_email, 
            crypt(v_password, gen_salt('bf')), 
            now(), 
            '{"provider": "email", "providers": ["email"]}', 
            '{"name": "Julio Admin", "role": "ADMIN"}', 
            now(), now(), 
            'authenticated', 'authenticated', FALSE
        );

        -- Insert Identity
        INSERT INTO auth.identities (
            id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
        ) VALUES (
            gen_random_uuid(), -- Identity ID is distinct
            v_user_id, 
            jsonb_build_object('sub', v_user_id, 'email', v_email), 
            'email', 
            v_user_id, 
            now(), now(), now()
        );
    END IF;

    -- 3. Ensure Profile Record (Upsert)
    INSERT INTO public.profiles (id, name, email, role, job_title, avatar_url, created_at)
    VALUES (
        v_user_id,
        'Julio Admin',
        v_email,
        'ADMIN',
        'Administrador',
        'https://github.com/shadcn.png',
        now()
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = 'ADMIN', -- Force Admin role
        email = v_email; -- Ensure email matches

    RAISE NOTICE 'Fix completed for user: %', v_email;
END $$;

COMMIT;
