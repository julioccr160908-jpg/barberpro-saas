-- Subscription Plans Table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL,
    interval TEXT NOT NULL DEFAULT 'month', -- 'month', 'week'
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Customer Subscriptions Table
CREATE TABLE IF NOT EXISTS customer_subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID REFERENCES profiles(id) ON DELETE CASCADE,
    plan_id UUID REFERENCES subscription_plans(id) ON DELETE CASCADE,
    organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'active', -- 'active', 'cancelled', 'past_due'
    next_billing_date TIMESTAMPTZ NOT NULL,
    mercado_pago_subscription_id TEXT, -- External ID
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE subscription_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_subscriptions ENABLE ROW LEVEL SECURITY;

-- Policies for subscription_plans
CREATE POLICY "Public profiles can view active plans"
    ON subscription_plans FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage their organization's plans"
    ON subscription_plans FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = subscription_plans.organization_id
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Policies for customer_subscriptions
CREATE POLICY "Customers can view their own subscriptions"
    ON customer_subscriptions FOR SELECT
    USING (customer_id = auth.uid());

CREATE POLICY "Admins can view their organization's subscriptions"
    ON customer_subscriptions FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = customer_subscriptions.organization_id
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
