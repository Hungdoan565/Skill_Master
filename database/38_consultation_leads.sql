-- ============================================
-- CONSULTATION LEADS TABLE
-- Stores contact form submissions from website
-- ============================================

-- First, ensure the table exists
CREATE TABLE IF NOT EXISTS public.consultation_leads (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    full_name TEXT NOT NULL,
    phone TEXT NOT NULL
);

-- Then add missing columns individually to handle cases where table existed
DO $$ 
BEGIN 
    -- Contact Information
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='email') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN email TEXT;
    END IF;

    -- Consultation Details
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='goal') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN goal TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='level') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN level TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='time_slot') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN time_slot TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='course') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN course TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='message') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN message TEXT;
    END IF;

    -- Tracking
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='source') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN source TEXT DEFAULT 'unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='source_page') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN source_page TEXT DEFAULT 'unknown';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='utm_params') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN utm_params JSONB DEFAULT '{}'::jsonb;
    END IF;

    -- Status & Assignment
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='status') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN status TEXT DEFAULT 'new';
        -- Add constraint only if not present
        IF NOT EXISTS (SELECT 1 FROM information_schema.constraint_column_usage WHERE table_name = 'consultation_leads' AND column_name = 'status' AND constraint_name = 'consultation_leads_status_check') THEN
            ALTER TABLE public.consultation_leads ADD CONSTRAINT consultation_leads_status_check CHECK (status IN ('new', 'contacted', 'scheduled', 'converted', 'lost'));
        END IF;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='assigned_to') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN assigned_to UUID REFERENCES auth.users(id);
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='notes') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN notes TEXT;
    END IF;

    -- Timestamps
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='contacted_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN contacted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='converted_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN converted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='consultation_leads' AND column_name='updated_at') THEN
        ALTER TABLE public.consultation_leads ADD COLUMN updated_at TIMESTAMPTZ DEFAULT NOW();
    END IF;
END $$;

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_consultation_leads_status ON public.consultation_leads(status);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_created_at ON public.consultation_leads(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_source ON public.consultation_leads(source);
CREATE INDEX IF NOT EXISTS idx_consultation_leads_assigned_to ON public.consultation_leads(assigned_to);

-- ============================================
-- RLS POLICIES
-- ============================================

ALTER TABLE public.consultation_leads ENABLE ROW LEVEL SECURITY;

-- Admin policies
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can view all consultation leads') THEN
        CREATE POLICY "Admin can view all consultation leads"
            ON public.consultation_leads FOR SELECT TO authenticated
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                    WHERE u.id = auth.uid() 
                    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
                )
            );
    END IF;

    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admin can update consultation leads') THEN
        CREATE POLICY "Admin can update consultation leads"
            ON public.consultation_leads FOR UPDATE TO authenticated
            USING (
                EXISTS (
                    SELECT 1 
                    FROM public.users u
                    JOIN public.roles r ON u.role_id = r.id
                    WHERE u.id = auth.uid() 
                    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
                )
            );
    END IF;
END $$;

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================

CREATE OR REPLACE FUNCTION update_consultation_leads_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS consultation_leads_updated_at ON public.consultation_leads;
CREATE TRIGGER consultation_leads_updated_at
    BEFORE UPDATE ON public.consultation_leads
    FOR EACH ROW
    EXECUTE FUNCTION update_consultation_leads_updated_at();

-- ============================================
-- COMMENTS
-- ============================================

COMMENT ON TABLE public.consultation_leads IS 'Stores contact form and consultation request submissions from the website';
COMMENT ON COLUMN public.consultation_leads.source IS 'Identifies which form/location the lead came from';
COMMENT ON COLUMN public.consultation_leads.status IS 'Lead lifecycle: new → contacted → scheduled → converted/lost';
