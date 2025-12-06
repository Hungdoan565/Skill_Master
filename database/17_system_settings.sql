-- ============================================================
-- SYSTEM SETTINGS - Cấu hình hệ thống động
-- Version: 1.0
-- Description: Bảng lưu các cấu hình hệ thống thay vì hardcode
-- ============================================================

-- ============================================================
-- 1. TẠO BẢNG SYSTEM_SETTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Scope: NULL = global, có center_id = setting riêng cho center đó
  center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  
  -- Key-Value pair
  key TEXT NOT NULL,
  value JSONB NOT NULL DEFAULT '{}',
  
  -- Metadata
  description TEXT,
  updated_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Đảm bảo không trùng key trong cùng scope
  UNIQUE(center_id, key)
);

-- ============================================================
-- 2. COMMENTS
-- ============================================================
COMMENT ON TABLE public.system_settings IS 'Bảng lưu cấu hình hệ thống động';
COMMENT ON COLUMN public.system_settings.center_id IS 'NULL = global setting, có giá trị = setting riêng cho center';
COMMENT ON COLUMN public.system_settings.key IS 'Tên setting (bank_config, grade_config, payroll_config, etc.)';
COMMENT ON COLUMN public.system_settings.value IS 'Giá trị setting dạng JSON';

-- ============================================================
-- 3. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_system_settings_key ON public.system_settings(key);
CREATE INDEX IF NOT EXISTS idx_system_settings_center ON public.system_settings(center_id);

-- ============================================================
-- 4. TRIGGER CẬP NHẬT updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION update_system_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_system_settings_timestamp ON public.system_settings;

CREATE TRIGGER trigger_update_system_settings_timestamp
  BEFORE UPDATE ON public.system_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_system_settings_updated_at();

-- ============================================================
-- 5. RLS POLICIES
-- ============================================================
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Super Admin có thể xem và sửa tất cả
CREATE POLICY "Super admin full access to settings"
ON public.system_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid() AND r.code = 'SUPER_ADMIN'
  )
);

-- Center Manager chỉ xem/sửa settings của center mình hoặc global
CREATE POLICY "Center manager access own center settings"
ON public.system_settings
FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON r.id = u.role_id
    WHERE u.id = auth.uid() 
    AND r.code = 'CENTER_MANAGER'
    AND (
      public.system_settings.center_id IS NULL 
      OR public.system_settings.center_id = u.center_id
    )
  )
);

-- ============================================================
-- 6. SEED DATA - Cấu hình mặc định
-- ============================================================

-- Bank Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'bank_config',
  '{
    "bankId": "MB",
    "accountNo": "0971268268",
    "accountName": "SKILL MASTER EDU",
    "template": "compact2"
  }'::jsonb,
  'Cấu hình ngân hàng nhận thanh toán VietQR'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Grade Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'grade_config',
  '{
    "defaultPassScore": 5.0,
    "maxTotalScore": 10.0,
    "defaultCalculationType": "weighted",
    "defaultTemplate": "programming"
  }'::jsonb,
  'Cấu hình điểm số mặc định'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Payroll Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'payroll_config',
  '{
    "defaultHourlyRate": 150000,
    "defaultPassword": "SkillMaster@123",
    "paymentMethods": ["cash", "bank_transfer"],
    "quickAmounts": [1000000, 2000000, 5000000]
  }'::jsonb,
  'Cấu hình lương và thanh toán'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- System Config (Global)
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'system_config',
  '{
    "appName": "Skill Master",
    "timezone": "Asia/Ho_Chi_Minh",
    "dateFormat": "DD/MM/YYYY",
    "currency": "VND",
    "language": "vi"
  }'::jsonb,
  'Cấu hình hệ thống chung'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- Security Config (Global) - Chỉ Super Admin
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
  NULL,
  'security_config',
  '{
    "sessionTimeout": 3600,
    "maxLoginAttempts": 5,
    "passwordMinLength": 8,
    "requireStrongPassword": true,
    "enable2FA": false
  }'::jsonb,
  'Cấu hình bảo mật (chỉ Super Admin)'
)
ON CONFLICT (center_id, key) DO UPDATE SET
  value = EXCLUDED.value,
  updated_at = NOW();

-- ============================================================
-- 7. FUNCTION: Lấy setting với fallback
-- ============================================================
CREATE OR REPLACE FUNCTION get_setting(setting_key TEXT, p_center_id UUID DEFAULT NULL)
RETURNS JSONB AS $$
DECLARE
  result JSONB;
BEGIN
  -- Thử lấy setting của center trước
  IF p_center_id IS NOT NULL THEN
    SELECT value INTO result
    FROM public.system_settings
    WHERE key = setting_key AND center_id = p_center_id;
    
    IF result IS NOT NULL THEN
      RETURN result;
    END IF;
  END IF;
  
  -- Fallback về global setting
  SELECT value INTO result
  FROM public.system_settings
  WHERE key = setting_key AND center_id IS NULL;
  
  RETURN COALESCE(result, '{}'::jsonb);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- 8. VERIFY
-- ============================================================
SELECT key, center_id, description, created_at 
FROM public.system_settings 
ORDER BY key;
