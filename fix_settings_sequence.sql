
-- Fix broken ID sequence on Settings table

BEGIN;

-- 1. Create sequence if it doesn't exist
CREATE SEQUENCE IF NOT EXISTS public.settings_id_seq;

-- 2. Link sequence to table (optional, but good practice)
ALTER SEQUENCE public.settings_id_seq OWNED BY public.settings.id;

-- 3. Set default value to use sequence
ALTER TABLE public.settings ALTER COLUMN id SET DEFAULT nextval('public.settings_id_seq');

-- 4. Sync sequence with existing data
SELECT setval('public.settings_id_seq', COALESCE((SELECT MAX(id) FROM public.settings), 0) + 1);

COMMIT;
