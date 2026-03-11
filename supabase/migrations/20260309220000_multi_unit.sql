-- Add franchise support to organizations
ALTER TABLE organizations ADD COLUMN IF NOT EXISTS parent_org_id UUID REFERENCES organizations(id);

-- Add managed organizations to profiles for multi-unit access
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS managed_orgs UUID[] DEFAULT '{}';

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_organizations_parent_org ON organizations(parent_org_id);

-- Update RLS for profiles to allow access to managed orgs
-- (This assumes the application will handle the organization context switch)
