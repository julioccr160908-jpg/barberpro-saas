-- Backfill identities
INSERT INTO auth.identities (id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at)
SELECT 
    id::text, -- user_id as identity id for email provider usually, or gen_random_uuid? 
              -- Actually for email provider usually the ID is the user's ID or email. 
              -- Let's check typical data. Usually it is the UUID of the identity, linking to user_id. 
              -- Standard Supabase: id is text (provider ID), provider is 'email'. 
              -- For email provider, the 'id' is often the user's UUID.
    id,
    format('{"sub": "%s", "email": "%s"}', id, email)::jsonb,
    'email',
    now(),
    now(),
    now()
FROM auth.users
WHERE NOT EXISTS (
    SELECT 1 FROM auth.identities WHERE user_id = auth.users.id
);
