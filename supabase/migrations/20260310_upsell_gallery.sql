-- Fase 21: Venda de Produtos e "Upsell" (Cross-sell)
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS products jsonb DEFAULT '[]'::jsonb;

-- Fase 22: Galeria de Cortes / Portfólio dos Barbeiros
CREATE TABLE IF NOT EXISTS gallery_images (
    id uuid DEFAULT uuid_generate_v4() PRIMARY KEY,
    organization_id uuid REFERENCES organizations(id) ON DELETE CASCADE,
    profile_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
    image_url text NOT NULL,
    description text,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ativar RLS
ALTER TABLE gallery_images ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança
CREATE POLICY "Public Read Gallery" ON gallery_images FOR SELECT USING (true);
CREATE POLICY "Admin Insert Gallery" ON gallery_images FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN') 
        AND gallery_images.organization_id = (
             SELECT organization_id FROM settings WHERE settings.organization_id = gallery_images.organization_id LIMIT 1
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id AND owner_id = auth.uid()
    )
);
CREATE POLICY "Admin Update Gallery" ON gallery_images FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN') 
        AND gallery_images.organization_id = (
             SELECT organization_id FROM settings WHERE settings.organization_id = gallery_images.organization_id LIMIT 1
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id AND owner_id = auth.uid()
    )
);
CREATE POLICY "Admin Delete Gallery" ON gallery_images FOR DELETE USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('ADMIN', 'SUPER_ADMIN') 
        AND gallery_images.organization_id = (
             SELECT organization_id FROM settings WHERE settings.organization_id = gallery_images.organization_id LIMIT 1
        )
    )
    OR
    EXISTS (
        SELECT 1 FROM organizations 
        WHERE id = gallery_images.organization_id AND owner_id = auth.uid()
    )
);
