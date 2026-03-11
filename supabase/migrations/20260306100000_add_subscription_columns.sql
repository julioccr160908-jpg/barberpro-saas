-- Add subscription/payment columns to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS mp_subscription_id TEXT,
  ADD COLUMN IF NOT EXISTS mp_payer_email TEXT,
  ADD COLUMN IF NOT EXISTS staff_limit INT DEFAULT 3;

-- Set existing active orgs to have their current limits
UPDATE public.organizations
SET staff_limit = CASE
  WHEN plan_type = 'enterprise' THEN 999
  WHEN plan_type = 'pro' THEN 6
  ELSE 3
END
WHERE staff_limit IS NULL OR staff_limit = 3;
