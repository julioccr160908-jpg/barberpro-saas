
-- Critical Integrity Check
ALTER TABLE organizations ADD CONSTRAINT organizations_slug_key UNIQUE (slug);
