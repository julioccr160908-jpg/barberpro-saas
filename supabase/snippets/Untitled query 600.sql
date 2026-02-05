ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Permitir leitura (já deve ter, mas garante)
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);

-- Permitir que você edite SEU PRÓPRIO perfil (Essa é a que faltava!)
CREATE POLICY "Users can update own" ON public.profiles FOR UPDATE USING (auth.uid() = id);