-- ============================================================
-- FIX: Consultation Requests — Schema Drift + RLS Gap
-- Version: 71
-- Date: 2026-03-15
-- Description:
--   1. ALTER CHECK constraint to match current code statuses
--      Old: ('new', 'contacted', 'scheduled', 'enrolled', 'cancelled')
--      New: ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'lost')
--   2. Add TEACHER to RLS SELECT/UPDATE policies (backend allows TEACHER)
-- ============================================================

-- ============================================================
-- FIX 1: STATUS CHECK CONSTRAINT
-- ============================================================

DO $$
DECLARE
    constraint_name TEXT;
BEGIN
    -- Find the existing CHECK constraint on status column
    SELECT con.conname INTO constraint_name
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'consultation_requests'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%status%';

    -- Drop old constraint if exists
    IF constraint_name IS NOT NULL THEN
        EXECUTE format('ALTER TABLE public.consultation_requests DROP CONSTRAINT %I', constraint_name);
        RAISE NOTICE 'Dropped old CHECK constraint: %', constraint_name;
    END IF;

    -- Migrate legacy status values BEFORE applying new constraint
    UPDATE public.consultation_requests SET status = 'closed' WHERE status = 'enrolled';
    UPDATE public.consultation_requests SET status = 'lost'   WHERE status = 'cancelled';
END $$;

-- Add new CHECK constraint with correct statuses
ALTER TABLE public.consultation_requests
    ADD CONSTRAINT consultation_requests_status_check
    CHECK (status IN ('new', 'assigned', 'contacted', 'scheduled', 'closed', 'lost'));

-- ============================================================
-- FIX 2: RLS POLICIES — ADD TEACHER ROLE
-- ============================================================

-- Recreate SELECT policy with TEACHER included
DROP POLICY IF EXISTS "Staff can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can view consultation requests"
ON public.consultation_requests FOR SELECT
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- Recreate UPDATE policy with TEACHER included
DROP POLICY IF EXISTS "Staff can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can update consultation requests"
ON public.consultation_requests FOR UPDATE
USING (
    EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
);

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Verify CHECK constraint
SELECT con.conname, pg_get_constraintdef(con.oid) AS definition
FROM pg_constraint con
JOIN pg_class rel ON rel.oid = con.conrelid
JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
WHERE nsp.nspname = 'public'
  AND rel.relname = 'consultation_requests'
  AND con.contype = 'c';

-- Verify RLS policies
SELECT policyname, cmd, qual
FROM pg_policies
WHERE tablename = 'consultation_requests'
  AND schemaname = 'public';
