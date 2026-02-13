-- =====================================================
-- FIX FINAL: RESTAURAR FOREIGN KEYS EM APPOINTMENTS
-- =====================================================
-- O erro 400 acontece porque as ligações (Foreign Keys)
-- entre appointments e profiles (barber/customer) SUMIRAM.
-- Este script recria essas ligações.
-- =====================================================

DO $$ 
BEGIN 
    -- 1. Recriar FK para Customer (appointments_customer_id_fkey)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'appointments_customer_id_fkey') THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_customer_id_fkey
        FOREIGN KEY (customer_id)
        REFERENCES profiles(id)
        ON DELETE CASCADE;
    END IF;

    -- 2. Recriar FK para Barber (appointments_barber_id_fkey)
    IF NOT EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'appointments_barber_id_fkey') THEN
        ALTER TABLE appointments
        ADD CONSTRAINT appointments_barber_id_fkey
        FOREIGN KEY (barber_id)
        REFERENCES profiles(id)
        ON DELETE SET NULL;
    END IF;

END $$;
