-- ============================================================
-- FIX: Update dispute_type constraint to match frontend values
-- ============================================================

-- Drop old constraint and add new one with correct values
ALTER TABLE public.payroll_disputes 
DROP CONSTRAINT IF EXISTS payroll_disputes_dispute_type_check;

ALTER TABLE public.payroll_disputes 
ADD CONSTRAINT payroll_disputes_dispute_type_check 
CHECK (dispute_type IN (
  'incorrect_hours',      -- Sai số giờ dạy
  'incorrect_rate',       -- Sai mức lương/giờ
  'missing_sessions',     -- Thiếu buổi dạy
  'incorrect_bonus',      -- Sai tiền thưởng
  'incorrect_deduction',  -- Sai tiền khấu trừ
  'other'                 -- Lý do khác
));

-- Verify
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'public.payroll_disputes'::regclass 
AND contype = 'c';
