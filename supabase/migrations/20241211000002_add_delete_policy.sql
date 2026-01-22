-- Adicionar policy de DELETE para a tabela profiles
-- Permite que qualquer usuário autenticado delete profiles (DEV ONLY)
DROP POLICY IF EXISTS "Anyone can delete profiles" ON profiles;
CREATE POLICY "Anyone can delete profiles" ON profiles FOR DELETE USING (true);

-- IMPORTANTE: Em produção, substitua por:
-- CREATE POLICY "Admins can delete profiles" ON profiles 
-- FOR DELETE USING (
--   EXISTS (
--     SELECT 1 FROM profiles p 
--     WHERE p.id = auth.uid() AND p.role = 'ADMIN'
--   )
-- );
