-- Backfill identities with correct types and omitting generated columns
INSERT INTO auth.identities (
    id,
    user_id,
    provider_id,
    identity_data,
    provider,
    last_sign_in_at,
    created_at,
    updated_at
    -- email is generated, do not insert
)
SELECT 
    gen_random_uuid(), -- id (uuid)
    id,                -- user_id (uuid)
    id::text,          -- provider_id (text)
    format('{"sub": "%s", "email": "%s", "email_verified": true, "phone_verified": false}', id, email)::jsonb,
    'email',
    now(),
    now(),
    now()
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = auth.users.id
);
