INSERT INTO auth.identities (
  id,
  user_id,
  identity_data,
  provider,
  provider_id,
  last_sign_in_at,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  '9c82ed2d-a9ad-4e79-9bb7-6ca13d75e394',
  '{"sub": "9c82ed2d-a9ad-4e79-9bb7-6ca13d75e394", "email": "julioccr1609@gmail.com", "email_verified": true, "phone_verified": false}'::jsonb,
  'email',
  '9c82ed2d-a9ad-4e79-9bb7-6ca13d75e394',
  now(),
  now(),
  now()
) ON CONFLICT (provider_id, provider) DO NOTHING;
