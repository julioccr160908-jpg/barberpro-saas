-- Adicionar policy de DELETE para appointments
DROP POLICY IF EXISTS "Anyone can delete appointments" ON appointments;
CREATE POLICY "Anyone can delete appointments" ON appointments FOR DELETE USING (true);
