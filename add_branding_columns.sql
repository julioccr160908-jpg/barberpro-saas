
ALTER TABLE public.organizations 
ADD COLUMN IF NOT EXISTS logo_url TEXT,
ADD COLUMN IF NOT EXISTS banner_url TEXT,
ADD COLUMN IF NOT EXISTS primary_color VARCHAR(20) DEFAULT '#D4AF37',
ADD COLUMN IF NOT EXISTS secondary_color VARCHAR(20) DEFAULT '#1A1A1A',
ADD COLUMN IF NOT EXISTS theme_mode VARCHAR(10) DEFAULT 'dark';

-- Force schema cache reload
NOTIFY pgrst, 'reload schema';
