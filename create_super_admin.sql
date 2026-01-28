DO $$
DECLARE
    v_user_id UUID := gen_random_uuid();
    v_email TEXT := 'julio1609@gmail.com';
    v_password TEXT := 'Julioccr2020';
    v_role user_role := 'SUPER_ADMIN';
BEGIN
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
        aud,
        is_sso_user
    )
    VALUES (
        v_user_id,
        '00000000-0000-0000-0000-000000000000',
        v_email,
        crypt(v_password, gen_salt('bf')),
        now(),
        '{"provider": "email", "providers": ["email"]}',
        '{"name": "Super Admin"}',
        now(),
        now(),
        'authenticated',
        'authenticated',
        false
    );

    -- Create Identity
    -- Removed email column as it is likely generated from identity_data
    INSERT INTO auth.identities (
        id,
        user_id,
        identity_data,
        provider,
        provider_id,
        last_sign_in_at,
        created_at,
        updated_at
    )
    VALUES (
        v_user_id,
        v_user_id,
        jsonb_build_object('sub', v_user_id, 'email', v_email),
        'email',
        v_user_id,
        now(),
        now(),
        now()
    );

    -- Create Profile
    INSERT INTO public.profiles (
        id,
        name,
        email,
        role,
        job_title,
        avatar_url
    )
    VALUES (
        v_user_id,
        'Super Admin',
        v_email,
        v_role,
        'Platform Administrator',
        'https://ui-avatars.com/api/?name=Super+Admin'
    )
    ON CONFLICT (id) DO UPDATE SET
        role = EXCLUDED.role,
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        job_title = EXCLUDED.job_title,
        avatar_url = EXCLUDED.avatar_url;

END $$;
