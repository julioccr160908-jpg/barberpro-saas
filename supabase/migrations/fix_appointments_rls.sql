-- =====================================================
-- FIX COMPLETO: Agendamentos não aparecem para clientes
-- =====================================================
-- Execute este SQL no Supabase Dashboard → SQL Editor
-- =====================================================

-- 1. Fix Profiles SELECT RLS: permitir usuário ver PRÓPRIO perfil
-- (Sem isso, cliente com organization_id NULL não consegue ler
--  nem o próprio perfil, causando falha em cascata)
DROP POLICY IF EXISTS "Users can view profiles in their organization" ON public.profiles;
CREATE POLICY "Users can view profiles in their organization"
ON public.profiles
FOR SELECT
USING (
    id = auth.uid()
    OR organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'SUPER_ADMIN')
);

-- 2. Garantir INSERT policy para profiles (pode ter sido removida)
DROP POLICY IF EXISTS "Users can insert their own profile." ON public.profiles;
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile"
ON public.profiles
FOR INSERT
WITH CHECK (id = auth.uid());

-- 3. Fix Appointments SELECT RLS: adicionar fallback por customer_id
DROP POLICY IF EXISTS "Users can view appointments in their organization" ON public.appointments;
CREATE POLICY "Users can view appointments in their organization"
ON public.appointments
FOR SELECT
USING (
    organization_id = (SELECT organization_id FROM public.profiles WHERE id = auth.uid())
    OR customer_id = auth.uid()
);

-- 4. Backfill: corrigir clientes existentes sem organization_id
UPDATE profiles p
SET organization_id = (
    SELECT DISTINCT a.organization_id
    FROM appointments a
    WHERE a.customer_id = p.id
    AND a.organization_id IS NOT NULL
    LIMIT 1
)
WHERE p.role = 'CUSTOMER'
AND p.organization_id IS NULL
AND EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = p.id);
