
-- Fix Portfolio Storage
-- 1. Create the bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public) 
VALUES ('portfolio', 'portfolio', true) 
ON CONFLICT (id) DO UPDATE SET public = true;

-- 2. Policies for portfolio bucket
-- Allow public access to view images
DROP POLICY IF EXISTS "Public Portfolio View" ON storage.objects;
CREATE POLICY "Public Portfolio View" 
ON storage.objects FOR SELECT 
USING ( bucket_id = 'portfolio' );

-- Allow authenticated users to upload images
DROP POLICY IF EXISTS "Authenticated Portfolio Upload" ON storage.objects;
CREATE POLICY "Authenticated Portfolio Upload" 
ON storage.objects FOR INSERT 
WITH CHECK ( bucket_id = 'portfolio' AND auth.role() = 'authenticated' );

-- Allow authenticated users to update their images
DROP POLICY IF EXISTS "Authenticated Portfolio Update" ON storage.objects;
CREATE POLICY "Authenticated Portfolio Update" 
ON storage.objects FOR UPDATE 
USING ( bucket_id = 'portfolio' AND auth.role() = 'authenticated' );

-- Allow authenticated users to delete images
DROP POLICY IF EXISTS "Authenticated Portfolio Delete" ON storage.objects;
CREATE POLICY "Authenticated Portfolio Delete" 
ON storage.objects FOR DELETE 
USING ( bucket_id = 'portfolio' AND auth.role() = 'authenticated' );
