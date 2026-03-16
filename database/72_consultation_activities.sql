-- ============================================================
-- CONSULTATION ACTIVITY TIMELINE
-- Version: 72
-- Date: 2026-03-15
-- Description: Activity log for consultation requests — tracks
--   status changes, notes, claims, follow-up actions
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultation_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    consultation_request_id UUID NOT NULL REFERENCES public.consultation_requests(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
    action TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

COMMENT ON TABLE public.consultation_activities IS 'Activity timeline for consultation requests — each status change, note, or action creates a row';
COMMENT ON COLUMN public.consultation_activities.action IS 'Action type: status_change, note_added, claimed, released, follow_up_created, follow_up_date_set';
COMMENT ON COLUMN public.consultation_activities.details IS 'Structured details: {old_status, new_status, note_excerpt, etc}';

-- Indexes
CREATE INDEX IF NOT EXISTS idx_consultation_activities_request_id
    ON public.consultation_activities(consultation_request_id);

CREATE INDEX IF NOT EXISTS idx_consultation_activities_created_at
    ON public.consultation_activities(created_at DESC);

-- RLS
ALTER TABLE public.consultation_activities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Staff can view consultation activities" ON public.consultation_activities;
CREATE POLICY "Staff can view consultation activities"
ON public.consultation_activities FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- Service role insert (backend uses service_role key)
DROP POLICY IF EXISTS "Service role can insert consultation activities" ON public.consultation_activities;
CREATE POLICY "Service role can insert consultation activities"
ON public.consultation_activities FOR INSERT
WITH CHECK (true);
