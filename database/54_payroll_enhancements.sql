-- ============================================================
-- PAYROLL ENHANCEMENTS - Bank Account, Payment Proof, Disputes
-- Version: 54
-- Description: Thêm thông tin ngân hàng cho GV, upload chứng từ thanh toán, hệ thống khiếu nại
-- ============================================================

-- ============================================================
-- 1. THÊM THÔNG TIN NGÂN HÀNG CHO GIÁO VIÊN (users table)
-- ============================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_name VARCHAR(100);

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_account_number VARCHAR(50);

ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS bank_account_holder VARCHAR(100);

COMMENT ON COLUMN public.users.bank_name IS 'Tên ngân hàng của giáo viên (VD: Vietcombank, BIDV, Techcombank)';
COMMENT ON COLUMN public.users.bank_account_number IS 'Số tài khoản ngân hàng';
COMMENT ON COLUMN public.users.bank_account_holder IS 'Tên chủ tài khoản ngân hàng';

-- ============================================================
-- 2. THÊM THÔNG TIN THANH TOÁN CHO PAYROLL
-- ============================================================
ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_proof_url TEXT;

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS paid_at TIMESTAMPTZ;

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS paid_by UUID REFERENCES public.users(id);

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_method VARCHAR(50) DEFAULT 'bank_transfer';

ALTER TABLE public.payroll 
ADD COLUMN IF NOT EXISTS payment_reference VARCHAR(100);

COMMENT ON COLUMN public.payroll.payment_proof_url IS 'URL ảnh chứng từ thanh toán (biên lai chuyển khoản)';
COMMENT ON COLUMN public.payroll.paid_at IS 'Thời điểm thanh toán thực tế';
COMMENT ON COLUMN public.payroll.paid_by IS 'Người thực hiện thanh toán';
COMMENT ON COLUMN public.payroll.payment_method IS 'Phương thức thanh toán: bank_transfer, cash, etc.';
COMMENT ON COLUMN public.payroll.payment_reference IS 'Mã giao dịch/tham chiếu thanh toán';

-- ============================================================
-- 3. TẠO BẢNG PAYROLL DISPUTES (Khiếu nại lương)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll_disputes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  payroll_id UUID NOT NULL REFERENCES public.payroll(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Nội dung khiếu nại
  reason TEXT NOT NULL,
  dispute_type VARCHAR(50) DEFAULT 'other' CHECK (dispute_type IN ('incorrect_hours', 'incorrect_rate', 'missing_sessions', 'incorrect_bonus', 'incorrect_deduction', 'other')),
  
  -- Trạng thái xử lý
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'reviewing', 'resolved', 'rejected')),
  
  -- Phản hồi từ admin
  admin_response TEXT,
  resolved_by UUID REFERENCES public.users(id),
  resolved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_payroll ON public.payroll_disputes(payroll_id);
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_teacher ON public.payroll_disputes(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_disputes_status ON public.payroll_disputes(status);

-- Comments
COMMENT ON TABLE public.payroll_disputes IS 'Bảng lưu trữ khiếu nại về lương từ giáo viên';

-- ============================================================
-- 4. RLS POLICIES CHO PAYROLL_DISPUTES
-- ============================================================
ALTER TABLE public.payroll_disputes ENABLE ROW LEVEL SECURITY;

-- Giáo viên chỉ xem khiếu nại của mình
CREATE POLICY "Teacher can view own disputes" ON public.payroll_disputes
  FOR SELECT USING (teacher_id = auth.uid());

-- Giáo viên có thể tạo khiếu nại
CREATE POLICY "Teacher can create disputes" ON public.payroll_disputes
  FOR INSERT WITH CHECK (teacher_id = auth.uid());

-- Admin có thể xem tất cả
CREATE POLICY "Admin can view all disputes" ON public.payroll_disputes
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin có thể update disputes
CREATE POLICY "Admin can update disputes" ON public.payroll_disputes
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 5. TRIGGER CẬP NHẬT updated_at CHO payroll_disputes
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_payroll_disputes_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_payroll_disputes_updated_at ON public.payroll_disputes;
CREATE TRIGGER trigger_update_payroll_disputes_updated_at
  BEFORE UPDATE ON public.payroll_disputes
  FOR EACH ROW
  EXECUTE FUNCTION public.update_payroll_disputes_updated_at();

-- ============================================================
-- 6. VIEW THỐNG KÊ DISPUTES
-- ============================================================
CREATE OR REPLACE VIEW public.v_payroll_disputes_stats AS
SELECT 
  COUNT(*) as total_disputes,
  COUNT(*) FILTER (WHERE status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE status = 'reviewing') as reviewing_count,
  COUNT(*) FILTER (WHERE status = 'resolved') as resolved_count,
  COUNT(*) FILTER (WHERE status = 'rejected') as rejected_count
FROM public.payroll_disputes;

COMMENT ON VIEW public.v_payroll_disputes_stats IS 'View thống kê nhanh về khiếu nại lương';

-- ============================================================
-- DONE!
-- ============================================================
