-- ============================================================
-- ADD INVOICE_TYPE COLUMN TO INVOICES TABLE
-- Version: 1.0
-- Description: Thêm cột loại hóa đơn để phân loại các loại phí
-- ============================================================

-- Thêm cột invoice_type vào bảng invoices
ALTER TABLE public.invoices 
ADD COLUMN IF NOT EXISTS invoice_type TEXT DEFAULT 'tuition' 
CHECK (invoice_type IN ('tuition', 'book', 'uniform', 'exam', 'other'));

-- Cập nhật các hóa đơn hiện có (đặt là tuition cho hóa đơn học phí)
UPDATE public.invoices 
SET invoice_type = 'tuition' 
WHERE invoice_type IS NULL;

-- Comment cho cột mới
COMMENT ON COLUMN public.invoices.invoice_type IS 'Loại hóa đơn: tuition (Học phí), book (Giáo trình), uniform (Đồng phục), exam (Phí thi), other (Phí khác)';

-- Index cho truy vấn theo loại hóa đơn
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_type ON public.invoices(invoice_type);
