-- ============================================================
-- PAYROLL UPGRADE - Nâng cấp schema cho tính năng Lương
-- Version: 1.0
-- Description: Thêm các trường cần thiết cho tính lương giáo viên
-- ============================================================

-- ============================================================
-- 1. THÊM TRƯỜNG HOURLY_RATE CHO GIÁO VIÊN (users table)
-- ============================================================
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS hourly_rate DECIMAL(12, 0) DEFAULT 150000;

COMMENT ON COLUMN public.users.hourly_rate IS 'Mức lương theo giờ mặc định của giáo viên (VNĐ)';

-- ============================================================
-- 2. NÂNG CẤP BẢNG SESSIONS CHO PAYROLL
-- ============================================================

-- 2.1 Thêm duration_hours (số giờ dạy)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS duration_hours DECIMAL(4, 2);

-- 2.2 Thêm teacher_rate (snapshot lương tại thời điểm dạy)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS teacher_rate DECIMAL(12, 0) DEFAULT 0;

-- 2.3 Thêm is_locked (khóa sổ sau khi tính lương)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT FALSE;

-- 2.4 Thêm payroll_id (link đến bảng payroll)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS payroll_id UUID;

-- 2.5 Thêm topic (chủ đề buổi học)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS topic VARCHAR(255);

-- 2.6 Thêm substitute_reason (lý do dạy thay)
ALTER TABLE public.sessions 
ADD COLUMN IF NOT EXISTS substitute_reason TEXT;

-- Comments
COMMENT ON COLUMN public.sessions.duration_hours IS 'Số giờ dạy, tính từ (end_time - start_time)';
COMMENT ON COLUMN public.sessions.teacher_rate IS 'Snapshot mức lương/giờ tại thời điểm dạy (VNĐ)';
COMMENT ON COLUMN public.sessions.is_locked IS 'TRUE nếu buổi học đã được tính lương, không cho sửa';
COMMENT ON COLUMN public.sessions.payroll_id IS 'Link đến bảng payroll khi đã tính lương';
COMMENT ON COLUMN public.sessions.topic IS 'Chủ đề/nội dung buổi học';
COMMENT ON COLUMN public.sessions.substitute_reason IS 'Lý do dạy thay nếu không phải GV chính';

-- ============================================================
-- 3. TẠO BẢNG PAYROLL (Bảng lương)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.payroll (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  
  -- Kỳ lương
  period_month INT NOT NULL CHECK (period_month BETWEEN 1 AND 12),
  period_year INT NOT NULL CHECK (period_year >= 2020),
  
  -- Thống kê
  total_sessions INT DEFAULT 0,           -- Tổng số buổi dạy
  total_hours DECIMAL(6, 2) DEFAULT 0,    -- Tổng số giờ dạy
  
  -- Tiền
  base_salary DECIMAL(15, 0) DEFAULT 0,   -- Lương cơ bản (total_hours * rate)
  bonus DECIMAL(15, 0) DEFAULT 0,          -- Thưởng
  deduction DECIMAL(15, 0) DEFAULT 0,      -- Khấu trừ
  net_salary DECIMAL(15, 0) DEFAULT 0,     -- Lương thực nhận
  
  -- Trạng thái
  status VARCHAR(20) DEFAULT 'draft' CHECK (status IN ('draft', 'pending', 'approved', 'paid')),
  
  -- Ghi chú
  notes TEXT,
  
  -- Người duyệt
  approved_by UUID REFERENCES public.users(id),
  approved_at TIMESTAMPTZ,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Unique: Mỗi GV chỉ có 1 bảng lương/tháng
  UNIQUE(teacher_id, period_month, period_year)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_payroll_teacher ON public.payroll(teacher_id);
CREATE INDEX IF NOT EXISTS idx_payroll_period ON public.payroll(period_year, period_month);
CREATE INDEX IF NOT EXISTS idx_payroll_status ON public.payroll(status);

-- Comments
COMMENT ON TABLE public.payroll IS 'Bảng lương giáo viên theo tháng';

-- ============================================================
-- 4. NÂNG CẤP BẢNG ATTENDANCE
-- ============================================================

-- 4.1 Update status constraint
ALTER TABLE public.attendance 
DROP CONSTRAINT IF EXISTS attendance_status_check;

ALTER TABLE public.attendance 
ADD CONSTRAINT attendance_status_check 
CHECK (status IN ('present', 'absent', 'late', 'excused'));

-- 4.2 Thêm check_in_time
ALTER TABLE public.attendance 
ADD COLUMN IF NOT EXISTS check_in_time TIMESTAMPTZ;

-- ============================================================
-- 5. FUNCTION TÍNH LƯƠNG THÁNG
-- ============================================================
CREATE OR REPLACE FUNCTION public.calculate_teacher_payroll(
  p_teacher_id UUID,
  p_month INT,
  p_year INT
) RETURNS TABLE (
  total_sessions INT,
  total_hours DECIMAL(6,2),
  base_salary DECIMAL(15,0)
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    COUNT(*)::INT as total_sessions,
    COALESCE(SUM(s.duration_hours), 0)::DECIMAL(6,2) as total_hours,
    COALESCE(SUM(s.duration_hours * s.teacher_rate), 0)::DECIMAL(15,0) as base_salary
  FROM public.sessions s
  WHERE 
    s.teacher_id = p_teacher_id
    AND s.status = 'completed'
    AND EXTRACT(MONTH FROM s.session_date) = p_month
    AND EXTRACT(YEAR FROM s.session_date) = p_year;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 6. RLS POLICIES CHO PAYROLL
-- ============================================================
ALTER TABLE public.payroll ENABLE ROW LEVEL SECURITY;

-- Giáo viên chỉ xem lương của mình
CREATE POLICY "Teacher can view own payroll" ON public.payroll
  FOR SELECT USING (teacher_id = auth.uid());

-- Admin/Manager có thể quản lý tất cả (Backend sẽ kiểm tra role thực)
-- RLS policy ở đây chỉ cho phép các user được xác thực
CREATE POLICY "Authenticated users can view payroll" ON public.payroll
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can insert payroll" ON public.payroll
  FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can update payroll" ON public.payroll
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

CREATE POLICY "Authenticated users can delete payroll" ON public.payroll
  FOR DELETE USING (
    EXISTS (SELECT 1 FROM public.users WHERE id = auth.uid())
  );

-- ============================================================
-- 7. VIEW THỐNG KÊ NHANH
-- ============================================================
CREATE OR REPLACE VIEW public.v_teacher_monthly_stats AS
SELECT 
  s.teacher_id,
  u.full_name as teacher_name,
  EXTRACT(YEAR FROM s.session_date)::INT as year,
  EXTRACT(MONTH FROM s.session_date)::INT as month,
  COUNT(*) as total_sessions,
  COUNT(*) FILTER (WHERE s.status = 'completed') as completed_sessions,
  COALESCE(SUM(s.duration_hours) FILTER (WHERE s.status = 'completed'), 0) as total_hours,
  COALESCE(SUM(s.duration_hours * s.teacher_rate) FILTER (WHERE s.status = 'completed'), 0) as total_earnings
FROM public.sessions s
JOIN public.users u ON s.teacher_id = u.id
GROUP BY s.teacher_id, u.full_name, 
         EXTRACT(YEAR FROM s.session_date), 
         EXTRACT(MONTH FROM s.session_date);

COMMENT ON VIEW public.v_teacher_monthly_stats IS 'View thống kê giờ dạy và thu nhập của giáo viên theo tháng';

-- ============================================================
-- DONE!
-- ============================================================
