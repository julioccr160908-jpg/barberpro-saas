-- CORREÇÃO DE PERMISSÕES DE STORAGE (Execute no SQL Editor)

-- 1. Permitir leitura pública (para carregar imagens no site)
DROP POLICY IF EXISTS "Public Access Organization Assets" ON storage.objects;
CREATE POLICY "Public Access Organization Assets"
ON storage.objects FOR SELECT
USING ( bucket_id = 'organization-assets' );

-- 2. Permitir upload para usuários logados
DROP POLICY IF EXISTS "Authenticated Insert Organization Assets" ON storage.objects;
CREATE POLICY "Authenticated Insert Organization Assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'organization-assets' );

-- 3. Permitir atualização (substituir imagem)
DROP POLICY IF EXISTS "Authenticated Update Organization Assets" ON storage.objects;
CREATE POLICY "Authenticated Update Organization Assets"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'organization-assets' );

-- 4. Permitir deletar (opcional, mas bom ter)
DROP POLICY IF EXISTS "Authenticated Delete Organization Assets" ON storage.objects;
CREATE POLICY "Authenticated Delete Organization Assets"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'organization-assets' );

-- Repetir para outros buckets caso o sistema use
DROP POLICY IF EXISTS "Public Access Profiles" ON storage.objects;
CREATE POLICY "Public Access Profiles"
ON storage.objects FOR SELECT
USING ( bucket_id = 'profiles' );

DROP POLICY IF EXISTS "Authenticated Upload Profiles" ON storage.objects;
CREATE POLICY "Authenticated Upload Profiles"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'profiles' );

DROP POLICY IF EXISTS "Authenticated Update Profiles" ON storage.objects;
CREATE POLICY "Authenticated Update Profiles"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'profiles' );
