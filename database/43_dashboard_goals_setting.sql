-- ============================================================
-- DASHBOARD GOALS SETTING
-- Version: 1.0
-- Description: Add dashboard_goals setting for configurable monthly targets
-- ============================================================

-- ============================================================
-- 1. CREATE SYSTEM_SETTINGS TABLE IF NOT EXISTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.system_settings (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
    key TEXT NOT NULL,
    value JSONB,
    description TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(center_id, key)
);

-- Handle NULL center_id for global settings
CREATE UNIQUE INDEX IF NOT EXISTS idx_system_settings_global_key 
ON public.system_settings (key) WHERE center_id IS NULL;

-- ============================================================
-- 2. INSERT DASHBOARD GOALS SETTING (Global)
-- ============================================================
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES (
    NULL,
    'dashboard_goals',
    '{
        "revenueGoal": 200000000,
        "studentsGoal": 50
    }'::jsonb,
    'Mục tiêu dashboard hàng tháng (doanh thu và học viên mới)'
)
ON CONFLICT (key) WHERE center_id IS NULL DO UPDATE SET
    value = EXCLUDED.value,
    updated_at = NOW();

-- Comment
COMMENT ON TABLE public.system_settings IS 'System configuration settings (global or per-center)';
COMMENT ON COLUMN public.system_settings.value IS 'Giá trị setting dạng JSON. dashboard_goals: {revenueGoal: number, studentsGoal: number}';
    
