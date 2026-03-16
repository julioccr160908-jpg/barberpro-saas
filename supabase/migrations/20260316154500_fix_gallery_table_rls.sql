
-- Fix Gallery Images Table RLS
-- The current policy is overly complex and may fail if certain tables (like settings) are inconsistent.

-- 1. Drop old policies
DROP POLICY IF EXISTS "Admin Insert Gallery" ON gallery_images;
DROP POLICY IF EXISTS "Admin Update Gallery" ON gallery_images;
DROP POLICY IF EXISTS "Admin Delete Gallery" ON gallery_images;
DROP POLICY IF EXISTS "Public Read Gallery" ON gallery_images;

-- 2. Create simplified policies
-- Allow everyone to view gallery images
CREATE POLICY "Anyone can view gallery images" 
ON gallery_images FOR SELECT 
USING (true);

-- Allow admins of the organization to insert
CREATE POLICY "Admins can insert gallery images" 
ON gallery_images FOR INSERT 
WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = gallery_images.organization_id
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id 
        AND owner_id = auth.uid()
    )
);

-- Allow admins of the organization to update
CREATE POLICY "Admins can update gallery images" 
ON gallery_images FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = gallery_images.organization_id
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id 
        AND owner_id = auth.uid()
    )
);

-- Allow admins of the organization to delete
CREATE POLICY "Admins can delete gallery images" 
ON gallery_images FOR DELETE 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND organization_id = gallery_images.organization_id
        AND role IN ('ADMIN', 'SUPER_ADMIN')
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id 
        AND owner_id = auth.uid()
    )
);
