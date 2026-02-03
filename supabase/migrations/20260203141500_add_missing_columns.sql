-- Migração para adicionar colunas faltantes no servidor de produção
-- Estas colunas existem no banco local mas não no remoto

-- 1. Adicionar organization_id na tabela profiles
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 2. Adicionar organization_id na tabela services
ALTER TABLE public.services 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id);

-- 3. Adicionar colunas faltantes na tabela settings
ALTER TABLE public.settings 
ADD COLUMN IF NOT EXISTS organization_id UUID REFERENCES public.organizations(id),
ADD COLUMN IF NOT EXISTS establishment_name TEXT,
ADD COLUMN IF NOT EXISTS address TEXT,
ADD COLUMN IF NOT EXISTS phone TEXT,
ADD COLUMN IF NOT EXISTS city TEXT,
ADD COLUMN IF NOT EXISTS state TEXT,
ADD COLUMN IF NOT EXISTS zip_code TEXT,
ADD COLUMN IF NOT EXISTS loyalty_enabled BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS loyalty_target INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS primary_color TEXT,
ADD COLUMN IF NOT EXISTS secondary_color TEXT;

-- 4. Remover constraint de single_row do settings se existir (para permitir múltiplas orgs)
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS single_row;

