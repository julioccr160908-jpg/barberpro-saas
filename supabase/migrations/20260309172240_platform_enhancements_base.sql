-- Create Audit Logs table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    user_id UUID REFERENCES auth.users(id),
    organization_id UUID REFERENCES organizations(id),
    action TEXT NOT NULL,
    entity_type TEXT NOT NULL, -- e.g., 'organization', 'profile', 'appointment'
    entity_id TEXT,
    old_data JSONB,
    new_data JSONB,
    ip_address TEXT,
    user_agent TEXT
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_audit_logs_org ON audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at DESC);

-- Create System Broadcasts table
CREATE TABLE IF NOT EXISTS system_broadcasts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    created_by UUID REFERENCES auth.users(id),
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    type TEXT DEFAULT 'info' NOT NULL, -- 'info', 'warning', 'error', 'success'
    target_role TEXT DEFAULT 'admin', -- 'admin', 'barber', 'all'
    starts_at TIMESTAMPTZ DEFAULT now() NOT NULL,
    ends_at TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    dismissible BOOLEAN DEFAULT true
);

-- Index for active alerts
CREATE INDEX IF NOT EXISTS idx_broadcasts_active ON system_broadcasts(is_active, starts_at, ends_at);

-- RLS for Audit Logs (Super Admin only for now)
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can read all audit logs" ON audit_logs
    FOR SELECT USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    );

-- RLS for System Broadcasts
ALTER TABLE system_broadcasts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Super Admins can manage broadcasts" ON system_broadcasts
    FOR ALL USING (
        (SELECT role FROM profiles WHERE id = auth.uid()) = 'SUPER_ADMIN'
    );

CREATE POLICY "Users can read active broadcasts" ON system_broadcasts
    FOR SELECT USING (
        is_active = true AND 
        starts_at <= now() AND 
        (ends_at IS NULL OR ends_at >= now())
    );
