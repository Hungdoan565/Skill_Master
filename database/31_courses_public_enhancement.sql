-- ============================================================
-- MIGRATION: Courses Page Enhancement
-- Version: 31
-- Date: 2025-12-24
-- Description: Add columns for public course display and consultation requests
-- ============================================================

-- ============================================================
-- PART 1: ENHANCE COURSES TABLE FOR PUBLIC DISPLAY
-- ============================================================

-- Add slug for SEO-friendly URLs
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS slug TEXT UNIQUE;

-- Add syllabus (curriculum timeline)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS syllabus JSONB DEFAULT '[]'::jsonb;

-- Add features (key selling points)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS features JSONB DEFAULT '[]'::jsonb;

-- Add outcomes (what students will learn)
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS outcomes JSONB DEFAULT '[]'::jsonb;

-- Add FAQ
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS faq JSONB DEFAULT '[]'::jsonb;

-- Add target audience description
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS target_audience TEXT;

-- Add prerequisites
ALTER TABLE public.courses 
ADD COLUMN IF NOT EXISTS prerequisites TEXT;

-- Generate slugs from course codes for existing courses
UPDATE public.courses 
SET slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE slug IS NULL;

-- Comments for documentation
COMMENT ON COLUMN public.courses.slug IS 'URL-friendly identifier, e.g., "ielts-academic"';
COMMENT ON COLUMN public.courses.syllabus IS 'Array of {week, title, topics[]} for curriculum display';
COMMENT ON COLUMN public.courses.features IS 'Array of feature strings, e.g., ["Giáo viên 8.0+", "Cam kết đầu ra"]';
COMMENT ON COLUMN public.courses.outcomes IS 'Array of learning outcomes';
COMMENT ON COLUMN public.courses.faq IS 'Array of {question, answer} pairs';
COMMENT ON COLUMN public.courses.target_audience IS 'Description of who should take this course';
COMMENT ON COLUMN public.courses.prerequisites IS 'Prerequisites for taking the course';

-- ============================================================
-- PART 2: CREATE CONSULTATION REQUESTS TABLE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.consultation_requests (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Contact info
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  
  -- Interest
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  
  -- Availability for callback
  preferred_time TEXT, -- e.g., "Sáng T2-T4" or "Chiều T3-T5"
  notes TEXT,
  
  -- Status tracking
  status TEXT NOT NULL DEFAULT 'new' CHECK (status IN ('new', 'contacted', 'scheduled', 'enrolled', 'cancelled')),
  
  -- Assignment
  assigned_to UUID REFERENCES public.users(id) ON DELETE SET NULL,
  follow_up_date DATE,
  
  -- Source tracking
  source TEXT DEFAULT 'website', -- website, facebook, zalo, referral, etc.
  utm_source TEXT,
  utm_campaign TEXT,
  
  -- Metadata
  center_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Comments
COMMENT ON TABLE public.consultation_requests IS 'Lead capture for course consultations before formal enrollment';
COMMENT ON COLUMN public.consultation_requests.status IS 'new: Chưa liên hệ, contacted: Đã liên hệ, scheduled: Đã hẹn lịch, enrolled: Đã đăng ký, cancelled: Hủy';

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_consultation_requests_status ON public.consultation_requests(status);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_course_id ON public.consultation_requests(course_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_center_id ON public.consultation_requests(center_id);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_created_at ON public.consultation_requests(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_consultation_requests_assigned_to ON public.consultation_requests(assigned_to);

-- ============================================================
-- PART 3: RLS POLICIES FOR CONSULTATION REQUESTS
-- ============================================================

ALTER TABLE public.consultation_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can INSERT (public form submission)
DROP POLICY IF EXISTS "Anyone can submit consultation request" ON public.consultation_requests;
CREATE POLICY "Anyone can submit consultation request"
ON public.consultation_requests FOR INSERT
WITH CHECK (true);

-- Only staff can SELECT
DROP POLICY IF EXISTS "Staff can view consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can view consultation requests"
ON public.consultation_requests FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  )
);

-- Only staff can UPDATE
DROP POLICY IF EXISTS "Staff can update consultation requests" ON public.consultation_requests;
CREATE POLICY "Staff can update consultation requests"
ON public.consultation_requests FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.users u
    JOIN public.roles r ON u.role_id = r.id
    WHERE u.id = auth.uid() 
    AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  )
);

-- ============================================================
-- PART 4: SEED SAMPLE SYLLABUS DATA FOR EXISTING COURSES
-- ============================================================

-- Update IELTS course with sample syllabus
UPDATE public.courses 
SET 
  syllabus = '[
    {"week": 1, "title": "Giới thiệu IELTS", "topics": ["Tổng quan về kỳ thi", "Đánh giá đầu vào", "Lập kế hoạch học tập"]},
    {"week": 2, "title": "Listening Skills", "topics": ["Note-taking strategies", "Prediction techniques", "Multiple choice tactics"]},
    {"week": 3, "title": "Reading Strategies", "topics": ["Skimming & Scanning", "Matching headings", "True/False/Not Given"]},
    {"week": 4, "title": "Writing Task 1", "topics": ["Graph description", "Data comparison", "Trend analysis"]},
    {"week": 5, "title": "Writing Task 2", "topics": ["Essay structures", "Argument development", "Conclusion writing"]},
    {"week": 6, "title": "Speaking Part 1-2", "topics": ["Personal topics", "Cue card techniques", "Fluency practice"]},
    {"week": 7, "title": "Speaking Part 3", "topics": ["Discussion skills", "Opinion expression", "Abstract topics"]},
    {"week": 8, "title": "Mock Test & Review", "topics": ["Full practice test", "Error analysis", "Score prediction"]}
  ]'::jsonb,
  features = '["Giáo viên IELTS 8.0+", "Cam kết đầu ra rõ ràng", "Chấm Writing miễn phí không giới hạn", "Thi thử hàng tuần", "Phòng tự học 24/7", "Tài liệu Cambridge chính hãng"]'::jsonb,
  outcomes = '["Nắm vững 4 kỹ năng Nghe - Nói - Đọc - Viết", "Đạt band điểm mục tiêu (cam kết)", "Tự tin giao tiếp tiếng Anh học thuật", "Sẵn sàng cho du học hoặc định cư"]'::jsonb,
  faq = '[
    {"question": "Tôi cần trình độ gì để học khóa này?", "answer": "Khóa học phù hợp với người có nền tảng tiếng Anh từ Pre-Intermediate trở lên (IELTS 4.0-5.0)."},
    {"question": "Có cam kết đầu ra không?", "answer": "Có. Chúng tôi cam kết đầu ra theo band điểm đã thỏa thuận. Nếu không đạt, bạn được học lại miễn phí."},
    {"question": "Có được hoàn tiền nếu không hài lòng?", "answer": "Bạn có thể yêu cầu hoàn tiền trong 7 ngày đầu tiên nếu cảm thấy không phù hợp."},
    {"question": "Một lớp có bao nhiêu học viên?", "answer": "Mỗi lớp từ 8-12 học viên để đảm bảo chất lượng tương tác."}
  ]'::jsonb,
  target_audience = 'Học viên muốn du học, định cư hoặc cần chứng chỉ IELTS cho công việc',
  prerequisites = 'Tiếng Anh Pre-Intermediate (IELTS 4.0-5.0) hoặc tương đương'
WHERE category = 'english' AND (title ILIKE '%IELTS%' OR code ILIKE '%IELTS%');

-- Update IT/Office courses with sample data
UPDATE public.courses 
SET 
  syllabus = '[
    {"week": 1, "title": "Microsoft Word", "topics": ["Giao diện và thao tác cơ bản", "Định dạng văn bản", "Tạo bảng và danh sách"]},
    {"week": 2, "title": "Microsoft Word Nâng cao", "topics": ["Mail Merge", "Header/Footer", "Table of Contents"]},
    {"week": 3, "title": "Microsoft Excel", "topics": ["Công thức cơ bản", "Hàm thông dụng", "Biểu đồ"]},
    {"week": 4, "title": "Microsoft Excel Nâng cao", "topics": ["VLOOKUP/HLOOKUP", "Pivot Table", "Data Validation"]},
    {"week": 5, "title": "Microsoft PowerPoint", "topics": ["Thiết kế slide", "Animation", "Master Slide"]},
    {"week": 6, "title": "Thi thử và Ôn tập", "topics": ["Làm đề thi mẫu", "Chữa bài", "Tips thi MOS"]}
  ]'::jsonb,
  features = '["Chứng chỉ MOS quốc tế", "Thực hành 70% thời lượng", "Học 1 kèm 1 hoặc nhóm nhỏ", "Giáo trình Microsoft chính hãng", "Hỗ trợ đăng ký thi tại trung tâm"]'::jsonb,
  outcomes = '["Sử dụng thành thạo Word, Excel, PowerPoint", "Đạt chứng chỉ MOS quốc tế", "Tăng hiệu suất công việc văn phòng", "CV ấn tượng hơn với chứng chỉ quốc tế"]'::jsonb,
  faq = '[
    {"question": "Chứng chỉ MOS có giá trị như thế nào?", "answer": "MOS là chứng chỉ được Microsoft công nhận toàn cầu, có giá trị vĩnh viễn và được nhiều nhà tuyển dụng đánh giá cao."},
    {"question": "Tôi chưa biết gì về máy tính, có học được không?", "answer": "Hoàn toàn được! Khóa học bắt đầu từ cơ bản, phù hợp với mọi trình độ."},
    {"question": "Lệ phí thi chứng chỉ có bao gồm trong học phí không?", "answer": "Lệ phí thi MOS không bao gồm trong học phí. Chi phí thi khoảng 1.200.000đ/môn."}
  ]'::jsonb,
  target_audience = 'Sinh viên, nhân viên văn phòng cần chứng chỉ tin học',
  prerequisites = 'Biết sử dụng máy tính cơ bản'
WHERE category = 'it' OR category = 'office' OR title ILIKE '%MOS%' OR title ILIKE '%Office%' OR title ILIKE '%Excel%';

-- ============================================================
-- VERIFICATION
-- ============================================================

-- Check courses have new columns
SELECT 
  code, 
  title, 
  slug,
  jsonb_array_length(syllabus) AS syllabus_items,
  jsonb_array_length(features) AS features_count,
  jsonb_array_length(faq) AS faq_count
FROM public.courses 
LIMIT 10;

-- Check consultation_requests table exists
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'consultation_requests' 
AND table_schema = 'public';

-- ============================================================
-- DONE!
-- ============================================================
