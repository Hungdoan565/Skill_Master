-- ============================================================
-- TEACHER COMPENSATION SYSTEM
-- Version: 55
-- Description: Hệ thống cấu hình lương giáo viên linh hoạt
--              Hỗ trợ: Lương theo giờ, Lương cố định, Kết hợp
-- ============================================================

-- ============================================================
-- 1. TẠO BẢNG TEACHER_COMPENSATION
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_compensation (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Teacher reference
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID REFERENCES public.centers(id), -- Denormalize for filtering
  
  -- Pay scheme type
  pay_scheme TEXT NOT NULL DEFAULT 'HOURLY_ONLY' CHECK (pay_scheme IN (
    'HOURLY_ONLY',        -- Chỉ lương theo giờ (part-time, sinh viên dạy thêm)
    'FIXED_ONLY',         -- Chỉ lương cố định (ít dùng)
    'FIXED_PLUS_HOURLY'   -- Lương cố định + thưởng giờ extra (full-time)
  )),
  
  -- Salary amounts
  hourly_rate NUMERIC(12,0) DEFAULT 150000,           -- Đơn giá/giờ (VND)
  fixed_monthly_salary NUMERIC(15,0) DEFAULT 0,       -- Lương cố định/tháng
  extra_hourly_rate NUMERIC(12,0),                    -- Đơn giá cho lớp extra (NULL = dùng hourly_rate)
  
  -- Effective dates (for history tracking)
  effective_from DATE NOT NULL DEFAULT CURRENT_DATE,
  effective_to DATE NULL,  -- NULL = đang hiệu lực
  
  -- Metadata
  notes TEXT,
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Constraints
  CONSTRAINT valid_date_range CHECK (effective_to IS NULL OR effective_to >= effective_from),
  CONSTRAINT valid_hourly_scheme CHECK (
    (pay_scheme = 'HOURLY_ONLY' AND hourly_rate IS NOT NULL AND hourly_rate > 0) OR
    (pay_scheme = 'FIXED_ONLY' AND fixed_monthly_salary IS NOT NULL) OR
    (pay_scheme = 'FIXED_PLUS_HOURLY' AND fixed_monthly_salary IS NOT NULL)
  )
);

-- Unique constraint: Only one active config per teacher at a time
CREATE UNIQUE INDEX IF NOT EXISTS idx_teacher_compensation_active
ON public.teacher_compensation(teacher_id)
WHERE effective_to IS NULL;

-- Indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_teacher ON public.teacher_compensation(teacher_id);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_center ON public.teacher_compensation(center_id);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_scheme ON public.teacher_compensation(pay_scheme);
CREATE INDEX IF NOT EXISTS idx_teacher_compensation_effective ON public.teacher_compensation(effective_from, effective_to);

-- Comments
COMMENT ON TABLE public.teacher_compensation IS 'Cấu hình lương giáo viên - Lưu trữ mức lương và loại hình trả lương';
COMMENT ON COLUMN public.teacher_compensation.pay_scheme IS 'Loại hình: HOURLY_ONLY (part-time), FIXED_ONLY (cố định), FIXED_PLUS_HOURLY (full-time + extra)';
COMMENT ON COLUMN public.teacher_compensation.hourly_rate IS 'Đơn giá/giờ dạy (VND)';
COMMENT ON COLUMN public.teacher_compensation.fixed_monthly_salary IS 'Lương cố định hàng tháng (VND)';
COMMENT ON COLUMN public.teacher_compensation.extra_hourly_rate IS 'Đơn giá cho lớp extra - NULL thì dùng hourly_rate';
COMMENT ON COLUMN public.teacher_compensation.effective_from IS 'Ngày bắt đầu hiệu lực';
COMMENT ON COLUMN public.teacher_compensation.effective_to IS 'Ngày kết thúc - NULL nghĩa là đang hiệu lực';

-- ============================================================
-- 2. THÊM CỘT FIXED_SALARY VÀO PAYROLL
-- ============================================================
ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS fixed_salary NUMERIC(15,0) NOT NULL DEFAULT 0;

ALTER TABLE public.payroll
ADD COLUMN IF NOT EXISTS compensation_id UUID REFERENCES public.teacher_compensation(id);

COMMENT ON COLUMN public.payroll.fixed_salary IS 'Lương cố định trong kỳ (từ teacher_compensation)';
COMMENT ON COLUMN public.payroll.compensation_id IS 'Reference đến cấu hình lương được áp dụng';

-- ============================================================
-- 3. TRIGGER CẬP NHẬT UPDATED_AT
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_teacher_compensation_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_teacher_compensation_updated_at ON public.teacher_compensation;
CREATE TRIGGER trigger_teacher_compensation_updated_at
  BEFORE UPDATE ON public.teacher_compensation
  FOR EACH ROW
  EXECUTE FUNCTION public.update_teacher_compensation_updated_at();

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.teacher_compensation ENABLE ROW LEVEL SECURITY;

-- Giáo viên xem cấu hình lương của mình
CREATE POLICY "Teacher can view own compensation" ON public.teacher_compensation
  FOR SELECT USING (teacher_id = auth.uid());

-- Admin/Manager xem tất cả
CREATE POLICY "Admin can view all compensations" ON public.teacher_compensation
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager có thể tạo/sửa
CREATE POLICY "Admin can manage compensations" ON public.teacher_compensation
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() 
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- ============================================================
-- 5. BACKFILL: Tạo cấu hình mặc định từ users.hourly_rate
-- ============================================================
INSERT INTO public.teacher_compensation (
  teacher_id,
  center_id,
  pay_scheme,
  hourly_rate,
  fixed_monthly_salary,
  effective_from,
  notes
)
SELECT 
  u.id AS teacher_id,
  u.center_id,
  'HOURLY_ONLY' AS pay_scheme,
  COALESCE(u.hourly_rate, 150000) AS hourly_rate,
  0 AS fixed_monthly_salary,
  CURRENT_DATE AS effective_from,
  'Auto-migrated from users.hourly_rate' AS notes
FROM public.users u
JOIN public.roles r ON u.role_id = r.id
WHERE r.code = 'TEACHER'
AND NOT EXISTS (
  SELECT 1 FROM public.teacher_compensation tc 
  WHERE tc.teacher_id = u.id AND tc.effective_to IS NULL
);

-- ============================================================
-- 6. VIEW: Thống kê cấu hình lương
-- ============================================================
CREATE OR REPLACE VIEW public.v_teacher_compensation_summary AS
SELECT 
  tc.id,
  tc.teacher_id,
  u.full_name AS teacher_name,
  u.email AS teacher_email,
  u.avatar_url,
  tc.center_id,
  c.name AS center_name,
  tc.pay_scheme,
  tc.hourly_rate,
  tc.fixed_monthly_salary,
  tc.extra_hourly_rate,
  tc.effective_from,
  tc.effective_to,
  CASE 
    WHEN tc.effective_to IS NULL THEN true 
    ELSE false 
  END AS is_active,
  tc.notes,
  tc.created_at,
  tc.updated_at
FROM public.teacher_compensation tc
JOIN public.users u ON tc.teacher_id = u.id
LEFT JOIN public.centers c ON tc.center_id = c.id
ORDER BY tc.effective_to IS NULL DESC, tc.updated_at DESC;

COMMENT ON VIEW public.v_teacher_compensation_summary IS 'View tổng hợp cấu hình lương giáo viên với thông tin chi tiết';

-- ============================================================
-- DONE!
-- ============================================================
