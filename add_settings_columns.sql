-- Add missing columns to settings table
ALTER TABLE settings 
ADD COLUMN IF NOT EXISTS establishment_name text,
ADD COLUMN IF NOT EXISTS address text,
ADD COLUMN IF NOT EXISTS phone text,
ADD COLUMN IF NOT EXISTS city text,
ADD COLUMN IF NOT EXISTS state text,
ADD COLUMN IF NOT EXISTS zip_code text;
