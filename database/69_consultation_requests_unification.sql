-- ============================================
-- CONSULTATION REQUESTS UNIFICATION
-- Canonical intake storage for Molly + website consultation forms
-- ============================================

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'source_page'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN source_page TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'user_id'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN user_id UUID REFERENCES public.users(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'session_id'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN session_id UUID REFERENCES public.chat_sessions(id) ON DELETE SET NULL;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'handoff_reason'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN handoff_reason TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'transcript_summary'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN transcript_summary TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'metadata'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN metadata JSONB NOT NULL DEFAULT '{}'::jsonb;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'assigned_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN assigned_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'contacted_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN contacted_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'scheduled_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN scheduled_at TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'consultation_requests' AND column_name = 'closed_at'
    ) THEN
        ALTER TABLE public.consultation_requests ADD COLUMN closed_at TIMESTAMPTZ;
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_phone_center_active
    ON public.consultation_requests(phone, center_id, status);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_source_page
    ON public.consultation_requests(source_page);

CREATE INDEX IF NOT EXISTS idx_consultation_requests_session_id
    ON public.consultation_requests(session_id)
    WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_user_id
    ON public.consultation_requests(user_id)
    WHERE user_id IS NOT NULL;

COMMENT ON COLUMN public.consultation_requests.source_page IS 'Path where the consultation request originated';
COMMENT ON COLUMN public.consultation_requests.user_id IS 'Authenticated user who created the consultation request when available';
COMMENT ON COLUMN public.consultation_requests.session_id IS 'Associated Molly chat session when the request came from chatbot handoff';
COMMENT ON COLUMN public.consultation_requests.handoff_reason IS 'Why the request was handed off to a human advisor';
COMMENT ON COLUMN public.consultation_requests.transcript_summary IS 'Short summary of the latest Molly conversation context';
COMMENT ON COLUMN public.consultation_requests.metadata IS 'Structured intake metadata including UTM parameters and form-specific fields';
