-- Allow customers to initiate their own subscriptions
CREATE POLICY "Customers can initiate their own subscriptions"
    ON customer_subscriptions FOR INSERT
    WITH CHECK (auth.uid() = customer_id);

-- Allow customers to update their own subscriptions (status change)
CREATE POLICY "Customers can update their own subscriptions"
    ON customer_subscriptions FOR UPDATE
    USING (auth.uid() = customer_id)
    WITH CHECK (auth.uid() = customer_id);

-- Allow admins to manage subscriptions for their organization
CREATE POLICY "Admins can manage subscriptions for their organization"
    ON customer_subscriptions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = customer_subscriptions.organization_id
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );
