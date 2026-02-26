-- ============================================================
-- TEACHER LEAVE REQUESTS
-- Version: 56
-- Description: Tạo bảng đơn xin nghỉ cho giáo viên
-- ============================================================

CREATE TABLE IF NOT EXISTS public.leave_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  leave_type VARCHAR(20) NOT NULL CHECK (leave_type IN ('sick', 'personal', 'annual', 'other')),
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  reason TEXT NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by UUID REFERENCES public.users(id),
  reviewed_at TIMESTAMPTZ,
  reviewer_note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT leave_requests_valid_date_range CHECK (end_date >= start_date)
);

CREATE INDEX IF NOT EXISTS idx_leave_requests_teacher_center_status
  ON public.leave_requests(teacher_id, center_id, status);

CREATE OR REPLACE FUNCTION public.update_leave_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_leave_requests_updated_at ON public.leave_requests;
CREATE TRIGGER trigger_leave_requests_updated_at
  BEFORE UPDATE ON public.leave_requests
  FOR EACH ROW
  EXECUTE FUNCTION public.update_leave_requests_updated_at();

ALTER TABLE public.leave_requests ENABLE ROW LEVEL SECURITY;

-- Teacher: xem đơn của chính mình
CREATE POLICY leave_requests_teacher_view_own ON public.leave_requests
  FOR SELECT
  USING (teacher_id = auth.uid());

-- Teacher: tạo đơn cho chính mình
CREATE POLICY leave_requests_teacher_insert_own ON public.leave_requests
  FOR INSERT
  WITH CHECK (teacher_id = auth.uid());

-- Teacher: chỉ xoa don pending cua chinh minh
CREATE POLICY leave_requests_teacher_delete_pending ON public.leave_requests
  FOR DELETE
  USING (teacher_id = auth.uid() AND status = 'pending');

-- Admin/Center Manager: xem tat ca don trong trung tam cua minh
CREATE POLICY leave_requests_manager_admin_view_center ON public.leave_requests
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        AND (
          r.code = 'SUPER_ADMIN'
          OR u.center_id = leave_requests.center_id
        )
    )
  );

COMMENT ON TABLE public.leave_requests IS 'Đơn xin nghỉ của giáo viên';
COMMENT ON COLUMN public.leave_requests.leave_type IS 'Loại nghỉ: sick, personal, annual, other';
COMMENT ON COLUMN public.leave_requests.status IS 'Trạng thái xử lý: pending, approved, rejected';
