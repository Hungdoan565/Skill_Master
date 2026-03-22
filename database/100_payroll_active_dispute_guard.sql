-- ============================================================
-- PAYROLL DISPUTES: Guard one active dispute per payroll/teacher
-- Version: 100
-- Description: Prevent concurrent pending/reviewing disputes for the same payroll.
-- ============================================================

CREATE UNIQUE INDEX IF NOT EXISTS idx_payroll_disputes_one_active_per_teacher
ON public.payroll_disputes (payroll_id, teacher_id)
WHERE status IN ('pending', 'reviewing');
