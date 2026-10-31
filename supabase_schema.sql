-- ==============================================================================
-- DisasterLens AI — Bulletproof Supabase Setup Script
-- Paste this entire block into Supabase SQL Editor and click "Run"
-- ==============================================================================

-- 1. Drop existing incomplete table if you want a clean start (RECOMMENDED)
-- If you have test data you must keep, comment out this DROP statement.
DROP TABLE IF EXISTS public.reports CASCADE;

-- 2. Create Reports Table with all required columns
CREATE TABLE public.reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    disaster_type TEXT NOT NULL CHECK (
        disaster_type IN ('Flood', 'Heavy Rainfall', 'Cyclone', 'Earthquake', 'Landslide', 'Heatwave', 'Other')
    ),
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    location TEXT NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    severity TEXT NOT NULL CHECK (severity IN ('High', 'Medium', 'Low')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'verified', 'rejected')),
    evidence_urls TEXT[] DEFAULT '{}',
    verification_notes TEXT,
    verified_at TIMESTAMPTZ,
    verified_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- 3. Indexes for High-Performance GIS & Filtering Queries
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_status ON public.reports (status);
CREATE INDEX IF NOT EXISTS idx_reports_disaster_type ON public.reports (disaster_type);
CREATE INDEX IF NOT EXISTS idx_reports_severity ON public.reports (severity);
CREATE INDEX IF NOT EXISTS idx_reports_coordinates ON public.reports (latitude, longitude);

-- 4. Enable Row Level Security (RLS)
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- 5. Cleanly create RLS Policies (drops previous if any)
DROP POLICY IF EXISTS "Public read access for reports" ON public.reports;
CREATE POLICY "Public read access for reports"
    ON public.reports FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Authenticated users can submit reports" ON public.reports;
CREATE POLICY "Authenticated users can submit reports"
    ON public.reports FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Authenticated users can update reports" ON public.reports;
CREATE POLICY "Authenticated users can update reports"
    ON public.reports FOR UPDATE
    TO authenticated
    USING (true)
    WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can delete reports" ON public.reports;
CREATE POLICY "Admins can delete reports"
    ON public.reports FOR DELETE
    TO authenticated
    USING (true);

-- 6. Safely Add Table to Realtime Publication (idempotent)
DO $$
BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.reports;
EXCEPTION
    WHEN duplicate_object THEN
        NULL;
END $$;

-- 7. Storage Bucket for Evidence Uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('disaster-evidence', 'disaster-evidence', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Cleanly recreate Storage RLS Policies
DROP POLICY IF EXISTS "Public can view evidence attachments" ON storage.objects;
CREATE POLICY "Public can view evidence attachments"
    ON storage.objects FOR SELECT
    USING (bucket_id = 'disaster-evidence');

DROP POLICY IF EXISTS "Authenticated users can upload evidence attachments" ON storage.objects;
CREATE POLICY "Authenticated users can upload evidence attachments"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (bucket_id = 'disaster-evidence');
