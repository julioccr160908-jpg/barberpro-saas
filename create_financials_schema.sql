
-- 1. Expenses Table
CREATE TABLE IF NOT EXISTS public.expenses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    date DATE NOT NULL,
    category TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Add Commission Rate to Profiles
-- Check if column exists first
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'commission_rate') THEN
        ALTER TABLE public.profiles ADD COLUMN commission_rate INTEGER DEFAULT 0;
    END IF;
END $$;

-- 3. Add Commission Amount to Appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'commission_amount') THEN
        ALTER TABLE public.appointments ADD COLUMN commission_amount DECIMAL(10,2) DEFAULT 0;
    END IF;
END $$;

-- Enable RLS for Expenses
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

-- Expenses Policy: Only Admin/Owner can manage
CREATE POLICY "Admins can manage expenses" ON public.expenses
    USING (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = organization_id) OR public.is_super_admin())
    WITH CHECK (auth.uid() IN (SELECT owner_id FROM public.organizations WHERE id = organization_id) OR public.is_super_admin());

-- Insert some dummy expenses for testing
DO $$
DECLARE
    v_org_id UUID;
BEGIN
    SELECT id INTO v_org_id FROM public.organizations LIMIT 1;
    
    IF v_org_id IS NOT NULL THEN
        INSERT INTO public.expenses (organization_id, title, amount, date, category)
        VALUES 
            (v_org_id, 'Aluguel', 1200.00, CURRENT_DATE, 'Fixo'),
            (v_org_id, 'Conta de Luz', 350.50, CURRENT_DATE, 'Fixo'),
            (v_org_id, 'Produtos', 450.00, CURRENT_DATE - INTERVAL '2 days', 'Variável');
    END IF;
END $$;
