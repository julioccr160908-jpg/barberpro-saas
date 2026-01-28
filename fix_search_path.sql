-- Force search_path for supabase_auth_admin
ALTER ROLE supabase_auth_admin SET search_path = public, auth, extensions;

-- Also Ensure extensions schema exists and is accessible
CREATE SCHEMA IF NOT EXISTS extensions;
GRANT USAGE ON SCHEMA extensions TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA extensions TO postgres, service_role, supabase_auth_admin;
GRANT ALL ON ALL ROUTINES IN SCHEMA extensions TO postgres, service_role, supabase_auth_admin;

-- Verify pgcrypto (often used in auth)
CREATE EXTENSION IF NOT EXISTS pgcrypto SCHEMA extensions;
