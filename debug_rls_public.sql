
BEGIN;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Public profiles are viewable by everyone" ON public.profiles;
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;

-- DEBUG POLICY: Allow everyone to read everywhere
CREATE POLICY "Debug: Public Read" ON public.profiles FOR SELECT USING (true);
COMMIT;
