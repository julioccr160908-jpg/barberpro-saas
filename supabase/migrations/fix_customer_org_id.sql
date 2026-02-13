-- Backfill organization_id for existing customers who have appointments
-- but are missing organization_id on their profile
UPDATE profiles p
SET organization_id = (
  SELECT DISTINCT a.organization_id
  FROM appointments a
  WHERE a.customer_id = p.id
  AND a.organization_id IS NOT NULL
  LIMIT 1
)
WHERE p.role = 'CUSTOMER'
AND p.organization_id IS NULL
AND EXISTS (SELECT 1 FROM appointments a WHERE a.customer_id = p.id);
