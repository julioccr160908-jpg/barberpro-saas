-- Create Reviews table
CREATE TABLE public.reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
    appointment_id UUID REFERENCES public.appointments(id) ON DELETE SET NULL,
    customer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    barber_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    photo_urls TEXT[] DEFAULT '{}',
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- Policies for reviews
CREATE POLICY "Public can view active reviews"
ON public.reviews FOR SELECT
USING (true);

CREATE POLICY "Customers can insert their own reviews"
ON public.reviews FOR INSERT
WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Admins can manage organization reviews"
ON public.reviews FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.organizations
    WHERE id = organization_id AND owner_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX idx_reviews_organization ON public.reviews(organization_id);
CREATE INDEX idx_reviews_barber ON public.reviews(barber_id);
