-- ============================================================
-- INVOICES TABLE - Hóa đơn học phí
-- Version: 1.0
-- Description: Quản lý công nợ và thanh toán học phí
-- ============================================================

-- ============================================================
-- 1. BẢNG INVOICES - Hóa đơn
-- ============================================================
CREATE TABLE IF NOT EXISTS public.invoices (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Mã hóa đơn tự động: INV-YYYYMMDD-XXXX
  invoice_code TEXT UNIQUE,
  
  -- Liên kết
  student_id UUID NOT NULL REFERENCES public.users(id),
  enrollment_id UUID REFERENCES public.enrollments(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id),
  
  -- Thông tin tài chính
  amount NUMERIC(12,2) NOT NULL DEFAULT 0,           -- Tổng tiền gốc
  discount_amount NUMERIC(12,2) DEFAULT 0,           -- Giảm giá
  final_amount NUMERIC(12,2) NOT NULL DEFAULT 0,     -- Số tiền phải đóng (amount - discount)
  paid_amount NUMERIC(12,2) DEFAULT 0,               -- Đã thanh toán
  
  -- Trạng thái
  status TEXT NOT NULL DEFAULT 'unpaid' CHECK (status IN ('unpaid', 'partial', 'paid', 'cancelled', 'refunded')),
  
  -- Thông tin bổ sung
  description TEXT,                                   -- Mô tả (VD: "Học phí lớp IELTS-ADV-K12")
  due_date DATE,                                      -- Hạn thanh toán
  paid_at TIMESTAMPTZ,                               -- Ngày thanh toán đủ
  
  -- Audit
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG PAYMENTS - Lịch sử thanh toán (Chi tiết từng lần đóng)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  invoice_id UUID NOT NULL REFERENCES public.invoices(id) ON DELETE CASCADE,
  
  amount NUMERIC(12,2) NOT NULL,                     -- Số tiền đóng lần này
  payment_method TEXT DEFAULT 'cash',                -- cash | bank_transfer | card | momo | vnpay
  
  reference_code TEXT,                               -- Mã giao dịch ngân hàng (nếu có)
  notes TEXT,
  
  received_by UUID REFERENCES public.users(id),      -- Ai thu tiền
  payment_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. FUNCTION: Tự động tạo mã hóa đơn
-- ============================================================
CREATE OR REPLACE FUNCTION generate_invoice_code()
RETURNS TRIGGER AS $$
DECLARE
  today_str TEXT;
  seq_num INT;
  new_code TEXT;
BEGIN
  -- Format: INV-YYYYMMDD-XXXX
  today_str := TO_CHAR(NOW(), 'YYYYMMDD');
  
  -- Đếm số hóa đơn trong ngày
  SELECT COUNT(*) + 1 INTO seq_num
  FROM public.invoices
  WHERE invoice_code LIKE 'INV-' || today_str || '-%';
  
  -- Tạo mã
  new_code := 'INV-' || today_str || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  NEW.invoice_code := new_code;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger tự động tạo mã
DROP TRIGGER IF EXISTS trigger_generate_invoice_code ON public.invoices;
CREATE TRIGGER trigger_generate_invoice_code
  BEFORE INSERT ON public.invoices
  FOR EACH ROW
  WHEN (NEW.invoice_code IS NULL)
  EXECUTE FUNCTION generate_invoice_code();

-- ============================================================
-- 4. FUNCTION: Cập nhật trạng thái hóa đơn khi thanh toán
-- ============================================================
CREATE OR REPLACE FUNCTION update_invoice_on_payment()
RETURNS TRIGGER AS $$
DECLARE
  total_paid NUMERIC(12,2);
  invoice_final NUMERIC(12,2);
BEGIN
  -- Tính tổng đã thanh toán
  SELECT COALESCE(SUM(amount), 0) INTO total_paid
  FROM public.payments
  WHERE invoice_id = NEW.invoice_id;
  
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

-- Trigger sau khi thêm payment
DROP TRIGGER IF EXISTS trigger_update_invoice_on_payment ON public.payments;
CREATE TRIGGER trigger_update_invoice_on_payment
  AFTER INSERT ON public.payments
  FOR EACH ROW
  EXECUTE FUNCTION update_invoice_on_payment();

-- ============================================================
-- 5. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_invoices_student_id ON public.invoices(student_id);
CREATE INDEX IF NOT EXISTS idx_invoices_enrollment_id ON public.invoices(enrollment_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON public.invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_created_at ON public.invoices(created_at);
CREATE INDEX IF NOT EXISTS idx_payments_invoice_id ON public.payments(invoice_id);

-- ============================================================
-- DONE! Invoices schema created successfully
-- ============================================================
