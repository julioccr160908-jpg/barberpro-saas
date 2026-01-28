-- 1. Create 'dono1@gmail.com' if not exists
-- We use uuid_generate_v4() for ID
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
DECLARE
    v_dono_id UUID;
    v_julio_id UUID;
    v_org_id UUID;
BEGIN
    -- Check if user exists, else insert
    SELECT id INTO v_dono_id FROM auth.users WHERE email = 'dono1@gmail.com';
    
    IF v_dono_id IS NULL THEN
        v_dono_id := gen_random_uuid();
        
        -- Insert into auth.users (Simple password hash for '123456')
        -- Note: Encrypted password for '123456' using bcrypt is usually lengthy. 
        -- For local supabase, we can try to use the crypt function or just insert a known hash.
        -- $2a$10$6.5.4.3.2.1.00000000000000000000000000000000000000 = dummy
        -- Let's use a standard bcrypt hash for '123456': $2a$10$Tw.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1.2.3.4.5.6.7.8.9.0.1 
        -- Actually, better to use the pgcrypto function: crypt('123456', gen_salt('bf'))
        
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
            v_dono_id, 
            '00000000-0000-0000-0000-000000000000', 
            'dono1@gmail.com', 
            crypt('123456', gen_salt('bf')), 
            now(), 
            '{"provider": "email", "providers": ["email"]}', 
            '{"name": "Dono Barbearia"}', 
            now(), 
            now(),
            'authenticated',
            'authenticated'
        );
        
        -- Insert into public.profiles (Trigger usually handles this, but let's be safe/explicit if trigger fails or is delayed)
        INSERT INTO public.profiles (id, email, name, role)
        VALUES (v_dono_id, 'dono1@gmail.com', 'Dono Barbearia', 'ADMIN')
        ON CONFLICT (id) DO NOTHING;
        
    END IF;

    -- 2. Get Julio's ID
    SELECT id INTO v_julio_id FROM auth.users WHERE email = 'julioccr1609@gmail.com';
    
    -- 3. Get the Default Organization
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;

    -- 4. Transfer Organization Ownership
    UPDATE public.organizations 
    SET owner_id = v_dono_id 
    WHERE id = v_org_id;

    -- 5. Update Dono's Profile
    UPDATE public.profiles
    SET role = 'ADMIN',
        organization_id = v_org_id
    WHERE id = v_dono_id;

    -- 6. Promote Julio to Super Admin and Detach
    UPDATE public.profiles
    SET role = 'SUPER_ADMIN',
        organization_id = NULL -- Super Admin is global
    WHERE id = v_julio_id;

    RAISE NOTICE 'Migration Complete: Dono1 created and owns Org. Julio is Super Admin.';
    
END $$;
