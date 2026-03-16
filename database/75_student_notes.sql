-- ============================================================
-- 75: Student Notes & Teaching Notes
-- Description: Bảng nhận xét học viên và ghi chú giảng dạy per-session
-- ============================================================

-- 1. Student Notes table
CREATE TABLE IF NOT EXISTS public.student_notes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    teacher_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
    session_id UUID REFERENCES public.sessions(id) ON DELETE SET NULL,
    content TEXT NOT NULL,
    note_type VARCHAR(20) DEFAULT 'general'
        CHECK (note_type IN ('academic', 'behavior', 'general')),
    is_shared_with_parent BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Performance indexes
CREATE INDEX IF NOT EXISTS idx_student_notes_teacher_student
    ON public.student_notes(teacher_id, student_id, class_id);

CREATE INDEX IF NOT EXISTS idx_student_notes_session
    ON public.student_notes(session_id) WHERE session_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_student_notes_class
    ON public.student_notes(class_id, created_at DESC);

-- 3. Enable RLS (safety layer, backend uses service key so bypassed but still recommended)
ALTER TABLE public.student_notes ENABLE ROW LEVEL SECURITY;

-- 4. Teaching notes columns on sessions table
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS teacher_notes TEXT;
ALTER TABLE public.sessions ADD COLUMN IF NOT EXISTS homework TEXT;

-- 5. Comments
COMMENT ON TABLE public.student_notes IS 'Nhận xét giáo viên về học viên theo lớp/buổi';
COMMENT ON COLUMN public.student_notes.note_type IS 'academic = học tập, behavior = thái độ, general = chung';
COMMENT ON COLUMN public.student_notes.is_shared_with_parent IS 'Chia sẻ với phụ huynh hay không';
COMMENT ON COLUMN public.sessions.teacher_notes IS 'Ghi chú nội dung đã dạy trong buổi';
COMMENT ON COLUMN public.sessions.homework IS 'Bài tập về nhà cho buổi này';
