-- ============================================================
-- MIGRATION: Add grading configuration to courses table
-- Version: 1.2
-- Date: 2025-12-01
-- Description: Thêm cấu hình cách tính điểm và điểm đạt
-- ============================================================

-- Thêm cột calculation_type: weighted (theo trọng số) hoặc sum (cộng gộp)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS calculation_type TEXT NOT NULL DEFAULT 'weighted' 
CHECK (calculation_type IN ('weighted', 'sum'));

-- Thêm cột pass_score: điểm đạt chuẩn đầu ra
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS pass_score DECIMAL(6,2) DEFAULT 5.0;

-- Thêm cột max_total_score: thang điểm tối đa (10, 9, 990...)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS max_total_score DECIMAL(6,2) DEFAULT 10.0;

-- Comments
COMMENT ON COLUMN public.courses.calculation_type IS 'Cách tính điểm: weighted (trọng số %) hoặc sum (cộng gộp như TOEIC)';
COMMENT ON COLUMN public.courses.pass_score IS 'Điểm đạt chuẩn đầu ra (5.0 cho IT, 6.5 cho IELTS, 500 cho TOEIC...)';
COMMENT ON COLUMN public.courses.max_total_score IS 'Thang điểm tối đa hiển thị (10, 9.0, 990...)';

-- Cập nhật dữ liệu mẫu cho các khóa hiện có
UPDATE public.courses 
SET 
  calculation_type = CASE 
    WHEN category IN ('toeic') THEN 'sum'
    ELSE 'weighted'
  END,
  pass_score = CASE 
    WHEN category = 'ielts' THEN 6.5
    WHEN category = 'toeic' THEN 500
    ELSE 5.0
  END,
  max_total_score = CASE 
    WHEN category = 'ielts' THEN 9.0
    WHEN category = 'toeic' THEN 990
    ELSE 10.0
  END
WHERE calculation_type IS NULL OR pass_score IS NULL;
