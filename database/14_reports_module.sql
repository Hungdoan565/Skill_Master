-- ============================================================
-- REPORTS MODULE - Báo cáo & Thống kê chi tiết
-- Version: 1.0
-- Description: Schema cho module báo cáo nâng cao
-- ============================================================

-- ============================================================
-- 1. BẢNG SAVED_REPORTS - Báo cáo đã lưu
-- ============================================================
CREATE TABLE IF NOT EXISTS public.saved_reports (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Loại báo cáo
  report_type VARCHAR(50) NOT NULL, -- 'revenue', 'enrollment', 'attendance', 'grades', 'staff', 'courses'
  
  -- Lưu filter đã chọn
  filters JSONB DEFAULT '{}', -- { dateRange, centerId, courseId, etc }
  
  -- Scheduled reports (optional)
  schedule VARCHAR(50), -- 'daily', 'weekly', 'monthly', null = không tự động
  email_recipients TEXT[], -- Danh sách email nhận báo cáo
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ,
  
  -- Audit
  created_by UUID REFERENCES public.users(id),
  center_id UUID REFERENCES public.centers(id),
  is_public BOOLEAN DEFAULT false, -- Có chia sẻ cho center không
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG REPORT_LOGS - Lịch sử chạy báo cáo (audit)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.report_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  saved_report_id UUID REFERENCES public.saved_reports(id) ON DELETE SET NULL,
  report_type VARCHAR(50) NOT NULL,
  
  -- Params khi chạy
  filters JSONB,
  
  -- Kết quả
  status VARCHAR(20) DEFAULT 'success', -- 'success', 'failed', 'exported'
  export_format VARCHAR(20), -- 'excel', 'pdf', null = chỉ view
  result_summary JSONB, -- { totalRecords, totalRevenue, etc }
  error_message TEXT,
  
  -- User
  run_by UUID REFERENCES public.users(id),
  run_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_saved_reports_user ON public.saved_reports(created_by);
CREATE INDEX IF NOT EXISTS idx_saved_reports_center ON public.saved_reports(center_id);
CREATE INDEX IF NOT EXISTS idx_saved_reports_type ON public.saved_reports(report_type);
CREATE INDEX IF NOT EXISTS idx_report_logs_report ON public.report_logs(saved_report_id);
CREATE INDEX IF NOT EXISTS idx_report_logs_type ON public.report_logs(report_type);
CREATE INDEX IF NOT EXISTS idx_report_logs_run_at ON public.report_logs(run_at DESC);

-- ============================================================
-- 4. RLS POLICIES
-- ============================================================
ALTER TABLE public.saved_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.report_logs ENABLE ROW LEVEL SECURITY;

-- Saved Reports: User xem báo cáo của mình hoặc báo cáo public của center
CREATE POLICY "Users can view own reports" ON public.saved_reports
  FOR SELECT USING (
    created_by = auth.uid() 
    OR (is_public = true AND center_id IN (
      SELECT center_id FROM public.users WHERE id = auth.uid()
    ))
  );

CREATE POLICY "Users can create own reports" ON public.saved_reports
  FOR INSERT WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update own reports" ON public.saved_reports
  FOR UPDATE USING (created_by = auth.uid());

CREATE POLICY "Users can delete own reports" ON public.saved_reports
  FOR DELETE USING (created_by = auth.uid());

-- Report Logs: User xem logs của mình
CREATE POLICY "Users can view own report logs" ON public.report_logs
  FOR SELECT USING (run_by = auth.uid());

CREATE POLICY "Users can create report logs" ON public.report_logs
  FOR INSERT WITH CHECK (run_by = auth.uid());

-- ============================================================
-- DONE! Reports module schema created
-- ============================================================
