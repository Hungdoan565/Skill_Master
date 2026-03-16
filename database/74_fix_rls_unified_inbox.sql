-- ============================================================
-- MIGRATION 74: Fix RLS policies for unified inbox
-- Allow students to SELECT/INSERT ticket_messages via
-- consultation_request_id → user_id chain
-- (Required for Supabase Realtime to work for student ↔ admin chat)
-- ============================================================

-- Drop and recreate ticket_messages SELECT policy
DROP POLICY IF EXISTS "ticket_messages_select_policy" ON public.ticket_messages;

CREATE POLICY "ticket_messages_select_policy" ON public.ticket_messages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        -- Direct creator
        t.created_by = auth.uid()
        -- Assigned staff
        OR t.assigned_to = auth.uid()
        -- Via consultation_request (for trigger-created tickets where created_by may be NULL)
        OR EXISTS (
          SELECT 1 FROM public.consultation_requests cr
          WHERE cr.id = t.consultation_request_id
          AND cr.user_id = auth.uid()
        )
        -- Staff roles (SUPER_ADMIN, CENTER_MANAGER, TEACHER)
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
    -- Internal notes: only staff can see
    AND (
      is_internal = false
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
      )
    )
  );

-- Drop and recreate ticket_messages INSERT policy
DROP POLICY IF EXISTS "ticket_messages_insert_policy" ON public.ticket_messages;

CREATE POLICY "ticket_messages_insert_policy" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        -- Direct creator
        t.created_by = auth.uid()
        -- Assigned staff
        OR t.assigned_to = auth.uid()
        -- Via consultation_request (for trigger-created tickets)
        OR EXISTS (
          SELECT 1 FROM public.consultation_requests cr
          WHERE cr.id = t.consultation_request_id
          AND cr.user_id = auth.uid()
        )
        -- Staff roles
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
  );

-- Also update support_tickets SELECT policy to allow student access via consultation chain
DROP POLICY IF EXISTS "support_tickets_select_policy" ON public.support_tickets;

CREATE POLICY "support_tickets_select_policy" ON public.support_tickets
  FOR SELECT USING (
    created_by = auth.uid()
    OR assigned_to = auth.uid()
    -- Via consultation_request (for trigger-created tickets)
    OR EXISTS (
      SELECT 1 FROM public.consultation_requests cr
      WHERE cr.id = consultation_request_id
      AND cr.user_id = auth.uid()
    )
    -- Staff roles
    OR EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );
