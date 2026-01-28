-- Adiciona coluna de telefone na tabela profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS phone TEXT;
