-- 1. Insert missing profile manually
INSERT INTO public.profiles (id, email, role, name, job_title, organization_id)
SELECT 
    id, 
    email, 
    'SUPER_ADMIN', 
    'Julio Admin', 
    'System Owner',
    (SELECT id FROM public.organizations WHERE slug = 'barberpro-demo')
FROM auth.users 
WHERE email = 'julioccr1609@gmail.com'
ON CONFLICT (id) DO UPDATE 
SET role = 'SUPER_ADMIN';

-- 2. Restore the trigger for future users
-- Function to handle new user
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, name, role)
  VALUES (
    new.id, 
    new.email, 
    new.raw_user_meta_data->>'full_name',
    'CUSTOMER' -- Default role
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();
