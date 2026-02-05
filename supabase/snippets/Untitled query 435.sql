ERROR:  42703: column "updated_at" of relation "profiles" does not exist
QUERY:  INSERT INTO public.profiles (
    id,
    name,
    email,
    role,
    organization_id,
    created_at,
    updated_at
  ) VALUES (
    v_user_id,
    'Dono 3',
    v_email,
    'ADMIN',
    v_org_id,
    now(),
    now()
  )
CONTEXT:  PL/pgSQL function inline_code_block line 75 at SQL statement