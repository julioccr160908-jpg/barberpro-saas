-- Adicionar policy de INSERT para a tabela settings
DROP POLICY IF EXISTS "Admins can insert settings" ON settings;
CREATE POLICY "Admins can insert settings" ON settings FOR INSERT WITH CHECK (true);

