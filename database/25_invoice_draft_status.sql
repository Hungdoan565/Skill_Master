-- ============================================================
-- INVOICE DRAFT STATUS SUPPORT
-- Version: 1.0
-- Description: Thêm trạng thái 'draft' cho invoices để hỗ trợ workflow confirm
-- ============================================================

-- 1. Thêm 'draft' vào CHECK constraint của status
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('draft', 'unpaid', 'partial', 'paid', 'cancelled', 'refunded'));

-- 2. Comment
COMMENT ON COLUMN public.invoices.status IS 
'Trạng thái hóa đơn: draft (nháp), unpaid (chưa thanh toán), partial (thanh toán 1 phần), paid (đã thanh toán), cancelled (đã hủy), refunded (đã hoàn tiền)';

-- 3. Index cho draft invoices (để query nhanh)
CREATE INDEX IF NOT EXISTS idx_invoices_status_draft ON public.invoices(status) WHERE status = 'draft';

-- 4. Function xác nhận invoice từ draft
CREATE OR REPLACE FUNCTION confirm_invoice(invoice_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.invoices
  SET status = CASE 
    WHEN paid_amount >= final_amount THEN 'paid'
    WHEN paid_amount > 0 THEN 'partial'
    ELSE 'unpaid'
  END,
  updated_at = NOW()
  WHERE id = invoice_id AND status = 'draft';
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION confirm_invoice IS 'Xác nhận invoice từ draft, tự động set status dựa trên paid_amount';

-- ============================================================
-- ROLLBACK SCRIPT (nếu cần)
-- ============================================================
/*
-- Revert constraint
ALTER TABLE public.invoices 
DROP CONSTRAINT IF EXISTS invoices_status_check;

ALTER TABLE public.invoices
ADD CONSTRAINT invoices_status_check 
CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled', 'refunded'));

-- Drop function
DROP FUNCTION IF EXISTS confirm_invoice(UUID);

-- Drop index
DROP INDEX IF EXISTS idx_invoices_status_draft;
*/
