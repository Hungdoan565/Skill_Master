-- ============================================================
-- Migration 76: Persist availability type for teacher slots
-- Purpose: keep `preferred` selection after save/reload
-- ============================================================

ALTER TABLE public.teacher_availability
ADD COLUMN IF NOT EXISTS type VARCHAR(20);

UPDATE public.teacher_availability
SET type = 'available'
WHERE type IS NULL;

ALTER TABLE public.teacher_availability
ALTER COLUMN type SET DEFAULT 'available';

ALTER TABLE public.teacher_availability
ALTER COLUMN type SET NOT NULL;

ALTER TABLE public.teacher_availability
DROP CONSTRAINT IF EXISTS teacher_availability_type_check;

ALTER TABLE public.teacher_availability
ADD CONSTRAINT teacher_availability_type_check
CHECK (type IN ('available', 'preferred'));

CREATE INDEX IF NOT EXISTS idx_teacher_availability_type ON public.teacher_availability(type);

COMMENT ON COLUMN public.teacher_availability.type IS 'Loại slot: available (có thể dạy), preferred (ưu tiên dạy)';

