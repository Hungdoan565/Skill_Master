-- ============================================================
-- INVOICE UPGRADE - Thêm tính năng mới cho hóa đơn
-- Version: 1.1
-- Description: Thêm invoice_type, cải thiện quản lý hóa đơn
-- ============================================================

-- ============================================================
-- 1. THÊM COLUMN invoice_type
-- ============================================================
-- Loại hóa đơn: tuition (học phí), book (sách), uniform (đồng phục), exam (thi), other (khác)

DO $$ 
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' 
    AND table_name = 'invoices' 
    AND column_name = 'invoice_type'
  ) THEN
    ALTER TABLE public.invoices 
    ADD COLUMN invoice_type TEXT DEFAULT 'tuition' 
    CHECK (invoice_type IN ('tuition', 'book', 'uniform', 'exam', 'other'));
    
    COMMENT ON COLUMN public.invoices.invoice_type IS 'Loại hóa đơn: tuition=học phí, book=sách, uniform=đồng phục, exam=phí thi, other=khác';
  END IF;
END $$;

-- ============================================================
-- 2. UPDATE EXISTING RECORDS
-- ============================================================
-- Đặt tất cả hóa đơn cũ là loại 'tuition'
UPDATE public.invoices 
SET invoice_type = 'tuition' 
WHERE invoice_type IS NULL;

-- ============================================================
-- 3. INDEX CHO INVOICE_TYPE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_type ON public.invoices(invoice_type);

-- ============================================================
-- 4. THÊM INDEX CHO DUE_DATE (để query overdue nhanh hơn)
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON public.invoices(due_date);

-- ============================================================
-- 5. VIEW: Hóa đơn quá hạn
-- ============================================================
CREATE OR REPLACE VIEW public.overdue_invoices AS
SELECT 
  i.*,
  u.full_name as student_name,
  u.email as student_email,
  u.phone as student_phone,
  c.name as class_name,
  CURRENT_DATE - i.due_date as days_overdue
FROM public.invoices i
LEFT JOIN public.users u ON i.student_id = u.id
LEFT JOIN public.classes c ON i.class_id = c.id
WHERE 
  i.due_date < CURRENT_DATE 
  AND i.status NOT IN ('paid', 'cancelled', 'refunded')
ORDER BY i.due_date ASC;

COMMENT ON VIEW public.overdue_invoices IS 'Danh sách hóa đơn quá hạn thanh toán';

-- ============================================================
-- DONE!
-- ============================================================
