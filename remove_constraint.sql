
-- Remove legacy "single_row" constraint that prevents multi-tenancy
ALTER TABLE public.settings DROP CONSTRAINT IF EXISTS single_row;
