-- ============================================================
-- FIX MIGRATION 52 - Skip existing policies
-- Run this if migration 52 failed due to "policy already exists"
-- ============================================================

-- Drop existing policies if any (safe to run multiple times)
DROP POLICY IF EXISTS "Admin can view reminder logs" ON public.payment_reminder_logs;
DROP POLICY IF EXISTS "Admin can view status logs" ON public.invoice_status_logs;
DROP POLICY IF EXISTS "Admin can manage call list" ON public.payment_call_list;

-- Re-create policies
CREATE POLICY "Admin can view reminder logs" ON public.payment_reminder_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

CREATE POLICY "Admin can view status logs" ON public.invoice_status_logs
    FOR SELECT USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

CREATE POLICY "Admin can manage call list" ON public.payment_call_list
    FOR ALL USING (
        EXISTS (SELECT 1 FROM public.users u JOIN public.roles r ON u.role_id = r.id 
                WHERE u.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER'))
    );

-- Verify tables exist
SELECT 
    'payment_reminder_logs' as table_name, 
    COUNT(*) as row_count 
FROM public.payment_reminder_logs
UNION ALL
SELECT 
    'invoice_status_logs', 
    COUNT(*) 
FROM public.invoice_status_logs
UNION ALL
SELECT 
    'payment_call_list', 
    COUNT(*) 
FROM public.payment_call_list;
