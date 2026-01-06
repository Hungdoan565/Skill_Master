-- ============================================================
-- INVOICE MODULE UPGRADE - Phase 1
-- Version: 1.0
-- Description: Thêm các cột cho payment verification và tracking
-- ============================================================

-- ============================================================
-- 1. UPGRADE PAYMENTS TABLE - Thêm verification columns
-- ============================================================

-- Bank transfer proof (screenshot upload)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS bank_proof_url TEXT;

-- Verification status: pending (bank transfer) | verified | rejected
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'verified';
-- Mặc định 'verified' cho cash, bank_transfer sẽ set 'pending'

-- Who verified
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- Rejection reason (if rejected)
ALTER TABLE public.payments 
ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add constraint for verification_status
ALTER TABLE public.payments 
DROP CONSTRAINT IF EXISTS payments_verification_status_check;

ALTER TABLE public.payments 
ADD CONSTRAINT payments_verification_status_check 
CHECK (verification_status IN ('pending', 'verified', 'rejected'));

-- ============================================================
-- FIX: Update existing payments to 'verified' status
-- This ensures backward compatibility with old payments
-- ============================================================
UPDATE public.payments 
SET verification_status = 'verified' 
WHERE verification_status IS NULL;

-- ============================================================
-- 2. UPGRADE INVOICES TABLE - Thêm reminder tracking
-- ============================================================

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS reminder_sent_at TIMESTAMPTZ;

ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS reminder_count INTEGER DEFAULT 0;

-- ============================================================
-- 3. CREATE STUDENT WALLET TABLE - Bảo lưu phí
-- ============================================================

CREATE TABLE IF NOT EXISTS public.student_wallet (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  student_id UUID REFERENCES public.users(id) UNIQUE NOT NULL,
  balance NUMERIC(12,2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  wallet_id UUID REFERENCES public.student_wallet(id) NOT NULL,
  amount NUMERIC(12,2) NOT NULL, -- positive = credit, negative = debit
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('credit', 'debit', 'refund', 'adjustment')),
  reference_id UUID, -- invoice_id hoặc enrollment_id
  reference_type TEXT, -- 'invoice', 'enrollment', 'refund'
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES public.users(id)
);

-- ============================================================
-- 4. UPDATE TRIGGER - Chỉ count verified payments
-- ============================================================

CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  invoice_final NUMERIC(12,2);
BEGIN
  -- Chỉ tính những payment đã verified
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id
    AND verification_status = 'verified';
  
  -- Lấy số tiền phải đóng
  SELECT final_amount INTO invoice_final
  FROM public.invoices
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật invoice
  UPDATE public.invoices
  SET 
    paid_amount = total_paid,
    status = CASE 
      WHEN total_paid >= invoice_final THEN 'paid'
      WHEN total_paid > 0 THEN 'partial'
      ELSE 'unpaid'
    END,
    paid_at = CASE WHEN total_paid >= invoice_final THEN NOW() ELSE NULL END,
    updated_at = NOW()
  WHERE id = NEW.invoice_id;
  
  -- Cập nhật enrollment.paid_amount (nếu có)
  UPDATE public.enrollments
  SET paid_amount = total_paid, updated_at = NOW()
  WHERE id = (SELECT enrollment_id FROM public.invoices WHERE id = NEW.invoice_id);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Cũng trigger khi UPDATE payment (để xử lý verify/reject)
DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment_update ON public.payments;
CREATE TRIGGER trigger_update_invoice_on_payment_update
  AFTER UPDATE OF verification_status ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();

-- ============================================================
-- 5. INDEXES
-- ============================================================

CREATE INDEX IF NOT EXISTS idx_payments_verification_status 
ON public.payments(verification_status);

CREATE INDEX IF NOT EXISTS idx_payments_payment_method 
ON public.payments(payment_method);

CREATE INDEX IF NOT EXISTS idx_student_wallet_student_id 
ON public.student_wallet(student_id);

CREATE INDEX IF NOT EXISTS idx_wallet_transactions_wallet_id 
ON public.wallet_transactions(wallet_id);

CREATE INDEX IF NOT EXISTS idx_invoices_reminder_sent_at 
ON public.invoices(reminder_sent_at);

-- ============================================================
-- 6. COMMENTS
-- ============================================================

COMMENT ON COLUMN public.payments.bank_proof_url IS 'URL của ảnh chụp màn hình xác nhận chuyển khoản';
COMMENT ON COLUMN public.payments.verification_status IS 'Trạng thái xác minh: pending (chờ xác nhận CK), verified (đã xác nhận), rejected (từ chối)';
COMMENT ON COLUMN public.payments.verified_by IS 'Admin đã xác nhận thanh toán';
COMMENT ON COLUMN public.payments.verified_at IS 'Thời điểm xác nhận';

COMMENT ON TABLE public.student_wallet IS 'Ví học viên để bảo lưu phí khi nghỉ học giữa chừng';
COMMENT ON TABLE public.wallet_transactions IS 'Lịch sử giao dịch ví học viên';

-- ============================================================
-- 7. RECALCULATE ALL INVOICE PAID_AMOUNT
-- Run this ONCE after migration to fix any inconsistencies
-- ============================================================

-- Recalculate paid_amount for all invoices based on verified payments
UPDATE public.invoices i
SET 
  paid_amount = COALESCE((
    SELECT SUM(p.amount)
    FROM public.payments p
    WHERE p.invoice_id = i.id
      AND p.verification_status = 'verified'
  ), 0),
  status = CASE 
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) >= i.final_amount THEN 'paid'
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  paid_at = CASE 
    WHEN COALESCE((
      SELECT SUM(p.amount)
      FROM public.payments p
      WHERE p.invoice_id = i.id
        AND p.verification_status = 'verified'
    ), 0) >= i.final_amount THEN NOW()
    ELSE NULL
  END,
  updated_at = NOW()
WHERE i.status != 'cancelled';

-- ============================================================
-- DONE! Invoice module upgraded successfully
-- ============================================================
