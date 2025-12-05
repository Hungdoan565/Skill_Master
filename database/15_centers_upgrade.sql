-- ============================================================
-- CENTERS UPGRADE - Nâng cấp schema cho tính năng Quản lý Trung tâm
-- Version: 1.0
-- Description: Thêm các trường cần thiết cho quản lý chi nhánh
-- ============================================================

-- ============================================================
-- 1. THÊM CÁC TRƯỜNG MỚI CHO BẢNG CENTERS
-- ============================================================

-- Mã trung tâm (duy nhất)
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS code TEXT UNIQUE;

-- Email liên hệ
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS email TEXT;

-- Logo trung tâm
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS logo_url TEXT;

-- Mô tả chi tiết
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS description TEXT;

-- Giờ làm việc (JSON format)
-- VD: {"monday": {"open": "08:00", "close": "21:00"}, ...}
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS working_hours JSONB DEFAULT '{
  "monday": {"open": "08:00", "close": "21:00"},
  "tuesday": {"open": "08:00", "close": "21:00"},
  "wednesday": {"open": "08:00", "close": "21:00"},
  "thursday": {"open": "08:00", "close": "21:00"},
  "friday": {"open": "08:00", "close": "21:00"},
  "saturday": {"open": "08:00", "close": "17:00"},
  "sunday": {"open": null, "close": null}
}'::jsonb;

-- Trạng thái hoạt động
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' 
CHECK (status IN ('active', 'inactive'));

-- Quản lý chính của trung tâm (reference đến users)
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS manager_id UUID REFERENCES public.users(id) ON DELETE SET NULL;

-- Timestamp cập nhật
ALTER TABLE public.centers 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- ============================================================
-- 2. THÊM COMMENTS
-- ============================================================
COMMENT ON COLUMN public.centers.code IS 'Mã trung tâm duy nhất (VD: CTR01, CTR02)';
COMMENT ON COLUMN public.centers.email IS 'Email liên hệ trung tâm';
COMMENT ON COLUMN public.centers.logo_url IS 'URL logo trung tâm';
COMMENT ON COLUMN public.centers.description IS 'Mô tả chi tiết về trung tâm';
COMMENT ON COLUMN public.centers.working_hours IS 'Giờ làm việc theo từng ngày (JSON)';
COMMENT ON COLUMN public.centers.status IS 'Trạng thái: active hoặc inactive';
COMMENT ON COLUMN public.centers.manager_id IS 'ID của quản lý chính (CENTER_MANAGER)';
COMMENT ON COLUMN public.centers.updated_at IS 'Thời điểm cập nhật cuối cùng';

-- ============================================================
-- 3. TẠO INDEX CHO PERFORMANCE
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_centers_status ON public.centers(status);
CREATE INDEX IF NOT EXISTS idx_centers_code ON public.centers(code);
CREATE INDEX IF NOT EXISTS idx_centers_manager ON public.centers(manager_id);

-- ============================================================
-- 4. TẠO TRIGGER CẬP NHẬT updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_centers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_centers_timestamp ON public.centers;

CREATE TRIGGER trigger_update_centers_timestamp
  BEFORE UPDATE ON public.centers
  FOR EACH ROW
  EXECUTE FUNCTION update_centers_updated_at();

-- ============================================================
-- 5. CẬP NHẬT DỮ LIỆU HIỆN TẠI (nếu có)
-- ============================================================
-- Tạo mã code cho các center chưa có
WITH ranked_centers AS (
  SELECT 
    id,
    ROW_NUMBER() OVER (ORDER BY created_at) as row_num
  FROM public.centers
  WHERE code IS NULL
)
UPDATE public.centers
SET code = 'CTR' || LPAD(ranked_centers.row_num::TEXT, 2, '0')
FROM ranked_centers
WHERE public.centers.id = ranked_centers.id;

-- ============================================================
-- 6. RLS POLICIES CHO CENTERS
-- ============================================================

-- Enable RLS
ALTER TABLE public.centers ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Anyone can view active centers" ON public.centers;
DROP POLICY IF EXISTS "Super admin can manage all centers" ON public.centers;
DROP POLICY IF EXISTS "Center manager can view own center" ON public.centers;

-- Policy: Ai cũng có thể xem các center đang active
CREATE POLICY "Anyone can view active centers" ON public.centers
  FOR SELECT
  USING (status = 'active' OR status IS NULL);

-- Policy: Super Admin có toàn quyền
CREATE POLICY "Super admin can manage all centers" ON public.centers
  FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid() AND r.code = 'SUPER_ADMIN'
    )
  );

-- Policy: Center Manager xem được center của mình
CREATE POLICY "Center manager can view own center" ON public.centers
  FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = centers.id
    )
  );

-- ============================================================
-- 7. SEED DATA BỔ SUNG (Nếu chỉ có 1 center)
-- ============================================================
DO $$
DECLARE
  center_count INT;
BEGIN
  SELECT COUNT(*) INTO center_count FROM public.centers;
  
  -- Nếu chỉ có 1 center, thêm 2 center demo nữa
  IF center_count <= 1 THEN
    INSERT INTO public.centers (name, code, address, hotline, email, description, status) 
    VALUES 
      ('Skill Master - Quận 1', 'CTR01', '123 Nguyễn Huệ, Quận 1, TP.HCM', '028-1234-5678', 'q1@skillmaster.edu.vn', 'Chi nhánh chính tại trung tâm Quận 1, gần phố đi bộ', 'active'),
      ('Skill Master - Quận 7', 'CTR02', '456 Nguyễn Văn Linh, Quận 7, TP.HCM', '028-8765-4321', 'q7@skillmaster.edu.vn', 'Chi nhánh Phú Mỹ Hưng, khu vực cao cấp', 'active'),
      ('Skill Master - Thủ Đức', 'CTR03', '789 Võ Văn Ngân, TP.Thủ Đức', '028-5555-6666', 'thuduc@skillmaster.edu.vn', 'Chi nhánh gần Đại học Sư phạm Kỹ thuật', 'active')
    ON CONFLICT DO NOTHING;
  END IF;
END $$;

-- ============================================================
-- DONE! Centers schema upgraded successfully
-- ============================================================
