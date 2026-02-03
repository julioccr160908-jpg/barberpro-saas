
-- Enable RLS on all tables (idempotent)
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 1. ORGANIZATIONS
DROP POLICY IF EXISTS "Public Access" ON organizations;
DROP POLICY IF EXISTS "Public read access" ON organizations;
DROP POLICY IF EXISTS "Owner or Admin update" ON organizations;
DROP POLICY IF EXISTS "Owner or Admin delete" ON organizations;
DROP POLICY IF EXISTS "Authenticated insert" ON organizations;

-- Public Read (Landing Page, Booking)
CREATE POLICY "Public Read" ON organizations FOR SELECT USING (true);

-- Authenticated Insert (New Signups)
CREATE POLICY "Authenticated Insert" ON organizations FOR INSERT 
WITH CHECK (auth.role() = 'authenticated'); 

-- Owner Update (Edit Settings)
CREATE POLICY "Owner Update" ON organizations FOR UPDATE 
USING (auth.uid() = owner_id OR (select is_super_admin()));

-- Owner Delete
CREATE POLICY "Owner Delete" ON organizations FOR DELETE 
USING (auth.uid() = owner_id OR (select is_super_admin()));


-- 2. SETTINGS
DROP POLICY IF EXISTS "Public Access" ON settings;

-- Public Read (Booking Flow needs branding/schedule)
CREATE POLICY "Public Read" ON settings FOR SELECT USING (true);

-- Owner Update (Via Organization relationship)
CREATE POLICY "Owner Update" ON settings FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = settings.organization_id 
    AND (o.owner_id = auth.uid() OR (select is_super_admin()))
  )
);
-- Insert (Usually happens via trigger or Owner)
CREATE POLICY "Owner Insert" ON settings FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = settings.organization_id 
    AND (o.owner_id = auth.uid() OR (select is_super_admin()))
  )
);


-- 3. PROFILES
DROP POLICY IF EXISTS "Public Access" ON profiles;

-- Public Read (Needed to see Barbers in booking)
CREATE POLICY "Public Read" ON profiles FOR SELECT USING (true);

-- Self Update
CREATE POLICY "Self Update" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Insert (Trigger managed usually, but allow Service Role or Self)
CREATE POLICY "Self Insert" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);


-- 4. APPOINTMENTS
DROP POLICY IF EXISTS "Public Access" ON appointments;

-- Read: Customer Own, Barber Own, or Org Owner
CREATE POLICY "Restricted Read" ON appointments FOR SELECT USING (
  auth.uid() = customer_id -- Customer seeing own
  OR auth.uid() = barber_id -- Barber seeing own
  OR EXISTS ( -- Org Owner seeing all in their org
    SELECT 1 FROM organizations o 
    WHERE o.id = appointments.organization_id 
    AND (o.owner_id = auth.uid() OR (select is_super_admin()))
  )
);

-- Insert: Authenticated (Booking) - Weakness: Any auth user can book? Yes, for now.
CREATE POLICY "Authenticated Insert" ON appointments FOR INSERT 
WITH CHECK (auth.role() = 'authenticated');

-- Update: Customer (Cancel only?), Barber, Owner
CREATE POLICY "Restricted Update" ON appointments FOR UPDATE USING (
  auth.uid() = customer_id 
  OR auth.uid() = barber_id 
  OR EXISTS (
    SELECT 1 FROM organizations o 
    WHERE o.id = appointments.organization_id 
    AND (o.owner_id = auth.uid() OR (select is_super_admin()))
  )
);
