
-- Add Payment Columns to Appointments
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_status') THEN
        ALTER TABLE public.appointments ADD COLUMN payment_status TEXT DEFAULT 'pending'; -- pending, approved, rejected
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'appointments' AND column_name = 'payment_id') THEN
        ALTER TABLE public.appointments ADD COLUMN payment_id TEXT;
    END IF;
END $$;
