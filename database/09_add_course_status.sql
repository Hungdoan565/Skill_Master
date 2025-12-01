-- ============================================================
-- MIGRATION: Add status column to courses table
-- Version: 1.1
-- Date: 2025-12-01
-- Description: Thêm cột status để quản lý trạng thái khóa học
-- ============================================================

-- Thêm cột status vào bảng courses
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'active' 
CHECK (status IN ('draft', 'active', 'inactive'));

-- Cập nhật các khóa học hiện tại thành active
UPDATE public.courses SET status = 'active' WHERE status IS NULL;

-- Comment cho cột mới
COMMENT ON COLUMN public.courses.status IS 'Trạng thái khóa học: draft (Nháp), active (Đang tuyển sinh), inactive (Tạm ngưng)';
