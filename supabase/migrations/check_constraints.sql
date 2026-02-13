-- =====================================================
-- CHECAR CONSTRAINTS (DEPOIS PODE BORRAR)
-- =====================================================
-- Executar para ver os nomes corretos das Foreign Keys
-- =====================================================

SELECT
    kcu.constraint_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name 
FROM 
    information_schema.key_column_usage AS kcu
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = kcu.constraint_name
WHERE kcu.table_name = 'appointments';
