-- ============================================================
-- SUPPORT TICKET <-> CONSULTATION FOLLOW-UP LINK
-- Version: 1.0
-- Description: Add canonical idempotent linkage for consultation follow-up threads
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'support_tickets'
      AND column_name = 'consultation_request_id'
  ) THEN
    ALTER TABLE public.support_tickets
      ADD COLUMN consultation_request_id UUID REFERENCES public.consultation_requests(id) ON DELETE SET NULL;
  END IF;
END $$;

CREATE UNIQUE INDEX IF NOT EXISTS idx_support_tickets_consultation_request_unique
  ON public.support_tickets(consultation_request_id)
  WHERE consultation_request_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_consultation_requests_follow_up_ticket_id
  ON public.consultation_requests ((metadata->>'follow_up_ticket_id'));

COMMENT ON COLUMN public.support_tickets.consultation_request_id
  IS 'Canonical link to consultation_requests for idempotent follow-up thread creation';
