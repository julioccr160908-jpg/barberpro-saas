-- MASTER RESTORE SCRIPT
DO $$
DECLARE
    v_admin_id UUID := gen_random_uuid();
    v_dono_id UUID := gen_random_uuid();
    v_demo_org_id UUID;
    v_dono_org_id UUID;
BEGIN
    -- 1. Restore Super Admin (julioccr1609)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data, aud, created_at, updated_at)
    VALUES (
        v_admin_id, 
        'julioccr1609@gmail.com', 
        crypt('Julioccr2020', gen_salt('bf')), 
        now(), 
        'authenticated', 
        '{"provider":"email","providers":["email"]}', 
        '{"name":"Julio Super Admin"}', 
        'authenticated', now(), now()
    );

    -- 2. Restore Dono1 (dono1)
    INSERT INTO auth.users (id, email, encrypted_password, email_confirmed_at, role, raw_app_meta_data, raw_user_meta_data, aud, created_at, updated_at)
    VALUES (
        v_dono_id, 
        'dono1@gmail.com', 
        crypt('123456', gen_salt('bf')), 
        now(), 
        'authenticated', 
        '{"provider":"email","providers":["email"]}', 
        '{"name":"Dono 1"}', 
        'authenticated', now(), now()
    );

    -- 3. Restore Organizations
    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('BarberPro Demo', 'barberpro-demo', v_admin_id, 'active', 'enterprise')
    RETURNING id INTO v_demo_org_id;

    INSERT INTO public.organizations (name, slug, owner_id, subscription_status, plan_type)
    VALUES ('Barbearia Dono1', 'barbearia-dono1', v_dono_id, 'pending', 'basic')
    RETURNING id INTO v_dono_org_id;

    -- 4. Restore Profiles
    INSERT INTO public.profiles (id, email, name, role, job_title, organization_id)
    VALUES (v_admin_id, 'julioccr1609@gmail.com', 'Julio Super Admin', 'SUPER_ADMIN', 'System Owner', v_demo_org_id);

    INSERT INTO public.profiles (id, email, name, role, job_title, organization_id)
    VALUES (v_dono_id, 'dono1@gmail.com', 'Dono 1', 'ADMIN', 'Owner', v_dono_org_id);

    RAISE NOTICE 'Restoration Complete. Admin ID: %, Dono ID: %', v_admin_id, v_dono_id;
END $$;
