-- ============================================================
-- MIGRATION 73: Unified Inbox
-- Extend support_tickets to absorb consultation requests
-- Auto-bridge: consultation_requests INSERT → support_ticket created
-- ============================================================

-- ============================================================
-- 1. EXTEND SUPPORT_TICKETS TABLE
-- ============================================================

-- Allow anonymous tickets (from chatbot/website guests)
ALTER TABLE public.support_tickets ALTER COLUMN created_by DROP NOT NULL;

-- Add source tracking
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'source'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN source TEXT DEFAULT 'manual';
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_name'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_name TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_phone'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_phone TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'guest_email'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN guest_email TEXT;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'consultation_metadata'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN consultation_metadata JSONB DEFAULT '{}';
    END IF;

    -- Subject column (some older tickets only have title)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'support_tickets' AND column_name = 'subject'
    ) THEN
        ALTER TABLE public.support_tickets ADD COLUMN subject TEXT;
    END IF;
END $$;

-- Comments
COMMENT ON COLUMN public.support_tickets.source IS 'Origin: manual, chatbot, website, website_course_detail';
COMMENT ON COLUMN public.support_tickets.guest_name IS 'Contact name for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.guest_phone IS 'Contact phone for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.guest_email IS 'Contact email for anonymous/guest tickets';
COMMENT ON COLUMN public.support_tickets.consultation_metadata IS 'CRM intake context: urgency, conversion, handoff, transcript, intake fields';

-- ============================================================
-- 2. EXPAND CATEGORY CONSTRAINT
-- ============================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'support_tickets'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%category%';

    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.support_tickets DROP CONSTRAINT %I', constraint_name);
    END IF;
END $$;

ALTER TABLE public.support_tickets ADD CONSTRAINT support_tickets_category_check
    CHECK (category IN ('general','technical','billing','course','schedule','certificate','consultation','other'));

-- ============================================================
-- 3. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_support_tickets_source ON public.support_tickets(source);

-- ============================================================
-- 4. AUTO-BRIDGE TRIGGER
-- When consultation_requests is inserted, auto-create support_ticket
-- ============================================================

CREATE OR REPLACE FUNCTION auto_create_ticket_from_consultation()
RETURNS TRIGGER AS $$
DECLARE
    new_ticket_number TEXT;
    metadata_obj JSONB;
    new_ticket_id UUID;
BEGIN
    -- Check if a ticket already exists for this consultation request
    IF EXISTS (
        SELECT 1 FROM public.support_tickets
        WHERE consultation_request_id = NEW.id
    ) THEN
        RETURN NEW;
    END IF;

    -- Generate ticket number
    new_ticket_number := generate_ticket_number();

    -- Build metadata
    metadata_obj := jsonb_build_object(
        'urgency_level', COALESCE((NEW.metadata->>'urgency_level'), 'warm'),
        'handoff_reason', COALESCE(NEW.handoff_reason, ''),
        'transcript_summary', COALESCE(NEW.transcript_summary, ''),
        'preferred_time', COALESCE(NEW.preferred_time, ''),
        'intake', jsonb_build_object(
            'goal', NEW.metadata->>'goal',
            'level', NEW.metadata->>'level',
            'course', NEW.metadata->>'course',
            'message', NEW.metadata->>'message'
        )
    );

    INSERT INTO public.support_tickets (
        ticket_number,
        subject,
        category,
        priority,
        status,
        source,
        created_by,
        guest_name,
        guest_phone,
        guest_email,
        consultation_request_id,
        consultation_metadata,
        center_id,
        created_at
    ) VALUES (
        new_ticket_number,
        'Tư vấn: ' || COALESCE(NEW.full_name, 'Khách hàng'),
        'consultation',
        CASE
            WHEN (NEW.metadata->>'urgency_level') = 'hot' THEN 'high'
            WHEN (NEW.metadata->>'urgency_level') = 'cold' THEN 'low'
            ELSE 'normal'
        END,
        'open',
        COALESCE(NEW.source, 'chatbot'),
        NEW.user_id,  -- NULL for anonymous visitors, UUID for authenticated students
        NEW.full_name,
        NEW.phone,
        NEW.email,
        NEW.id,
        metadata_obj,
        NEW.center_id,
        NEW.created_at
    )
    RETURNING id INTO new_ticket_id;

    -- Update consultation_request with the ticket link
    UPDATE public.consultation_requests
    SET follow_up_ticket_id = new_ticket_id
    WHERE id = NEW.id
      AND follow_up_ticket_id IS NULL;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_consultation_to_ticket ON public.consultation_requests;
CREATE TRIGGER trg_consultation_to_ticket
    AFTER INSERT ON public.consultation_requests
    FOR EACH ROW
    EXECUTE FUNCTION auto_create_ticket_from_consultation();

-- ============================================================
-- 5. BACKFILL: Create tickets for existing consultation_requests
-- that do NOT already have a linked ticket
-- ============================================================

DO $$
DECLARE
    rec RECORD;
    new_ticket_number TEXT;
    meta JSONB;
    new_ticket_id UUID;
BEGIN
    FOR rec IN
        SELECT cr.* FROM public.consultation_requests cr
        LEFT JOIN public.support_tickets st ON st.consultation_request_id = cr.id
        WHERE st.id IS NULL
    LOOP
        new_ticket_number := generate_ticket_number();
        meta := jsonb_build_object(
            'urgency_level', COALESCE((rec.metadata->>'urgency_level'), 'warm'),
            'handoff_reason', COALESCE(rec.handoff_reason, ''),
            'transcript_summary', COALESCE(rec.transcript_summary, ''),
            'preferred_time', COALESCE(rec.preferred_time, '')
        );

        INSERT INTO public.support_tickets (
            ticket_number, subject, category, priority, status, source,
            guest_name, guest_phone, guest_email,
            consultation_request_id, consultation_metadata,
            center_id, created_at
        ) VALUES (
            new_ticket_number,
            'Tư vấn: ' || COALESCE(rec.full_name, 'Khách hàng'),
            'consultation', 'normal', 'open',
            COALESCE(rec.source, 'chatbot'),
            rec.full_name, rec.phone, rec.email,
            rec.id, meta,
            rec.center_id, rec.created_at
        )
        RETURNING id INTO new_ticket_id;

        -- Link back
        UPDATE public.consultation_requests
        SET follow_up_ticket_id = new_ticket_id
        WHERE id = rec.id
          AND follow_up_ticket_id IS NULL;
    END LOOP;
END;
$$;

-- ============================================================
-- DONE
-- ============================================================
