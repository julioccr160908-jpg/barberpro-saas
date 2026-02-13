-- =====================================================
-- FIX FINAL DE RECURSÃO INFINITA (500 ERROR)
-- =====================================================
-- Execute este script no Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Helper Function: get_auth_role()
-- Retorna o role do usuário sem disparar RLS na tabela profiles (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_auth_role()
RETURNS text
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Helper Function: get_auth_org_id()
-- Retorna o organization_id do usuário sem disparar RLS (SECURITY DEFINER)
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 3. Fix Profiles Policy (ZERO Recursion)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
    -- 1. Usuário sempre vê o próprio perfil
    id = auth.uid()
    OR 
    -- 2. Usuário vê perfis da mesma organização (usando função segura)
    organization_id = get_auth_org_id()
    OR 
    -- 3. Super Admin vê tudo (usando função segura)
    get_auth_role() = 'SUPER_ADMIN'
);

-- 4. Fix Appointments Policy (Safe)
DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
CREATE POLICY "Users can view appointments in their organization"
ON public.appointments
FOR SELECT
USING (
    -- Admin/Staff vê agendamentos da org
    organization_id = get_auth_org_id()
    OR 
    -- Cliente vê seus próprios agendamentos
    customer_id = auth.uid()
);

-- Grant execute permissions (just in case)
GRANT EXECUTE ON FUNCTION get_auth_role TO authenticated;
GRANT EXECUTE ON FUNCTION get_auth_org_id TO authenticated;
