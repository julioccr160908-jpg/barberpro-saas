-- Fix Permissions for Auth
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role, supabase_auth_admin, dashboard_user;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, supabase_auth_admin, dashboard_user, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA auth TO postgres, supabase_auth_admin, dashboard_user, service_role;
GRANT ALL ON ALL ROUTINES IN SCHEMA auth TO postgres, supabase_auth_admin, dashboard_user, service_role;

-- Ensure auth_admin can read public schema (sometimes needed for triggers)
GRANT USAGE ON SCHEMA public TO supabase_auth_admin;
GRANT ALL ON ALL TABLES IN SCHEMA public TO supabase_auth_admin;
