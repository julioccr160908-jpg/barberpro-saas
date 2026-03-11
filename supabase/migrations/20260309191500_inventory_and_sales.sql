-- Create products table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10,2) NOT NULL DEFAULT 0,
    stock_quantity INTEGER NOT NULL DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    image_url TEXT,
    category TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sales table (for standalone or linked to appointments)
CREATE TABLE IF NOT EXISTS public.sales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    payment_method TEXT, -- 'pix', 'card', 'cash'
    status TEXT DEFAULT 'completed', -- 'completed', 'cancelled'
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create sale_items for many-to-many relationship
CREATE TABLE IF NOT EXISTS public.sale_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    sale_id UUID NOT NULL REFERENCES public.sales(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
    quantity INTEGER NOT NULL DEFAULT 1,
    unit_price DECIMAL(10,2) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Products Policies
CREATE POLICY "Enable read access for all users in org" ON public.products
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = products.organization_id
        )
    );

CREATE POLICY "Enable all for admins in org" ON public.products
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = products.organization_id
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN')
        )
    );

-- Sales Policies
CREATE POLICY "Enable read for org members" ON public.sales
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND (profiles.organization_id = sales.organization_id OR profiles.role = 'SUPER_ADMIN')
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN', 'BARBER')
        )
    );

CREATE POLICY "Enable insert for org members" ON public.sales
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.profiles
            WHERE profiles.id = auth.uid()
            AND profiles.organization_id = sales.organization_id
            AND profiles.role IN ('ADMIN', 'SUPER_ADMIN', 'BARBER')
        )
    );

-- Sale Items Policies
CREATE POLICY "Enable read for org members" ON public.sale_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.sales
            JOIN public.profiles ON (profiles.organization_id = sales.organization_id OR profiles.role = 'SUPER_ADMIN')
            WHERE sales.id = sale_items.sale_id
            AND profiles.id = auth.uid()
        )
    );

CREATE POLICY "Enable insert for org members" ON public.sale_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.sales
            JOIN public.profiles ON profiles.organization_id = sales.organization_id
            WHERE sales.id = sale_items.sale_id
            AND profiles.id = auth.uid()
        )
    );

-- Trigger for updated_at on products
CREATE TRIGGER products_updated_at
    BEFORE UPDATE ON public.products
    FOR EACH ROW
    EXECUTE PROCEDURE public.handle_updated_at();

-- Trigger to update stock on sale
CREATE OR REPLACE FUNCTION public.update_stock_after_sale()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.products
    SET stock_quantity = stock_quantity - NEW.quantity
    WHERE id = NEW.product_id;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER sale_items_after_insert
    AFTER INSERT ON public.sale_items
    FOR EACH ROW
    EXECUTE PROCEDURE public.update_stock_after_sale();
