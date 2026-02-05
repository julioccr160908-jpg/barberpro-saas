-- DANGER: Desativa verificação de segurança para testes
ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;

-- Garante permissão total
GRANT ALL ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;