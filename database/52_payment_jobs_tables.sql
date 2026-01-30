-- ============================================================
-- PAYMENT JOBS TABLES
-- Version: 1.0
-- Description: Tables for payment reminder jobs and call list
-- ============================================================

-- ============================================================
-- 1. PAYMENT_REMINDER_LOGS - Track sent reminders
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_reminder_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    reminder_type VARCHAR(50) NOT NULL, -- 'upcoming_3_days', 'due_today', 'overdue_1_day', 'overdue_7_days'
    channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
    sent_at TIMESTAMPTZ DEFAULT NOW(),
    status VARCHAR(20) DEFAULT 'sent', -- 'sent', 'failed', 'delivered', 'opened'
    error_message TEXT,
    metadata JSONB,
    
    -- Prevent duplicate reminders
    UNIQUE(invoice_id, reminder_type)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_reminder_logs_invoice ON public.payment_reminder_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_type ON public.payment_reminder_logs(reminder_type);
CREATE INDEX IF NOT EXISTS idx_reminder_logs_sent_at ON public.payment_reminder_logs(sent_at);

-- ============================================================
-- 2. INVOICE_STATUS_LOGS - Track status changes
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoice_status_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    old_status VARCHAR(20),
    new_status VARCHAR(20) NOT NULL,
    changed_by UUID REFERENCES public.users(id),
    changed_at TIMESTAMPTZ DEFAULT NOW(),
    reason TEXT,
    metadata JSONB
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_status_logs_invoice ON public.invoice_status_logs(invoice_id);
CREATE INDEX IF NOT EXISTS idx_status_logs_changed_at ON public.invoice_status_logs(changed_at);

-- ============================================================
-- 3. PAYMENT_CALL_LIST - Invoices requiring phone follow-up
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payment_call_list (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id),
    priority VARCHAR(20) DEFAULT 'normal', -- 'low', 'normal', 'high', 'urgent'
    days_overdue INTEGER,
    amount_due NUMERIC(12,2),
    added_at TIMESTAMPTZ DEFAULT NOW(),
    assigned_to UUID REFERENCES public.users(id), -- Staff assigned to call
    last_call_at TIMESTAMPTZ,
    call_count INTEGER DEFAULT 0,
    call_notes TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- 'pending', 'called', 'promised', 'paid', 'escalated'
    next_call_date DATE,
    resolved_at TIMESTAMPTZ,
    metadata JSONB, -- Extra info: student_name, student_phone, invoice_code, due_date
    
    UNIQUE(invoice_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_call_list_status ON public.payment_call_list(status);
CREATE INDEX IF NOT EXISTS idx_call_list_priority ON public.payment_call_list(priority);
CREATE INDEX IF NOT EXISTS idx_call_list_assigned ON public.payment_call_list(assigned_to);
CREATE INDEX IF NOT EXISTS idx_call_list_next_call ON public.payment_call_list(next_call_date);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.payment_reminder_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.invoice_status_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payment_call_list ENABLE ROW LEVEL SECURITY;

-- Admin can view all
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

-- NOTE: Service role (used by backend jobs) bypasses RLS entirely in Supabase
-- No additional policies needed for service role operations

-- ============================================================
-- 5. COMMENTS
-- ============================================================
COMMENT ON TABLE public.payment_reminder_logs IS 'Lịch sử gửi nhắc nhở thanh toán';
COMMENT ON TABLE public.invoice_status_logs IS 'Lịch sử thay đổi trạng thái hóa đơn';
COMMENT ON TABLE public.payment_call_list IS 'Danh sách cần gọi điện nhắc thanh toán';

COMMENT ON COLUMN public.payment_call_list.priority IS 'Mức độ ưu tiên: low, normal, high, urgent';
COMMENT ON COLUMN public.payment_call_list.status IS 'Trạng thái: pending, called, promised, paid, escalated';

