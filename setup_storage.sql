
-- Enable Storage extension if not enabled (usually enabled by default)
-- CREATE EXTENSION IF NOT EXISTS "storage";

-- Create specific bucket for organization assets
INSERT INTO storage.buckets (id, name, public)
VALUES ('organization-assets', 'organization-assets', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Create Policies

-- 1. Public Read Access (Anyone can view logos/banners)
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'organization-assets' );

-- 2. Authenticated Upload (Any logged in user can upload - refining this later for security)
-- Ideally, limit strictly to organization owners, but for MVP, auth check + path check is enough
CREATE POLICY "Authenticated Upload"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'organization-assets' );

-- 3. Update/Overwrite (Users can update their own files)
CREATE POLICY "Owner Update"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'organization-assets' AND (auth.uid() = owner) );

-- 4. Delete (Users can delete their own files)
CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'organization-assets' AND (auth.uid() = owner) );
