-- Enable RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Create policy to allow users to read their own profile
-- Using a DO block to safely drop if exists (Postgres 9.x+ style using exception handling or simple DROP IF EXISTS)
DROP POLICY IF EXISTS "Users can view own profile" ON profiles;
DROP POLICY IF EXISTS "Users can see own profile" ON profiles;

CREATE POLICY "Users can view own profile"
ON profiles FOR SELECT
USING ( auth.uid() = id );

-- Also verify if we need public access for things like 'Staff' page, 
-- but for now, let's fix the critical "Login/Menu" issue.
