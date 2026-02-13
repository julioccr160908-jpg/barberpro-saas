-- =====================================================
-- FIX RECURSÃO INFINITA EM RLS
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Criar função SECURITY DEFINER para buscar organization_id sem disparar RLS
CREATE OR REPLACE FUNCTION get_auth_org_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER -- Executa com permissões de admin (bypassa RLS)
SET search_path = public
STABLE
AS $$
  SELECT organization_id FROM profiles WHERE id = auth.uid() LIMIT 1;
$$;

-- 2. Corrigir Users can view profiles in their organization
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
    id = auth.uid()
    OR 
    organization_id = get_auth_org_id() -- Usa a função segura
    OR 
    EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 3. Corrigir Users can view appointments in their organization
-- (Opcional, mas recomendado para consistência e performance)
DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
CREATE POLICY "Users can view appointments in their organization"
ON public.appointments
FOR SELECT
USING (
    organization_id = get_auth_org_id() -- Usa a função segura
    OR 
    customer_id = auth.uid()
);
