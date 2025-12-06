-- ============================================================
-- SKILL MASTER DATABASE - CERTIFICATE TYPES UPGRADE
-- Version: 1.0
-- Description: Nâng cấp hệ thống chứng chỉ với loại chứng chỉ chuyên nghiệp
-- ============================================================

-- ============================================================
-- 1. BẢNG CERTIFICATE_TYPES - Loại chứng chỉ (Master data)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_types (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Basic info
  code TEXT UNIQUE NOT NULL, -- IELTS, TOEIC, MOS_EXCEL, EXCEL_ADVANCED, etc.
  name TEXT NOT NULL, -- Tên hiển thị: "IELTS", "TOEIC", "Microsoft Office Specialist - Excel"
  description TEXT,
  
  -- Provider info
  provider TEXT, -- British Council, ETS, Microsoft, Trung tâm ABC, etc.
  provider_logo TEXT, -- URL logo nhà cấp
  
  -- Certificate type classification
  category TEXT NOT NULL DEFAULT 'language' CHECK (category IN ('language', 'office', 'programming', 'soft_skill', 'other')),
  is_external BOOLEAN DEFAULT false, -- true = chứng chỉ bên ngoài (IELTS, TOEIC thật)
  is_internal BOOLEAN DEFAULT true, -- true = chứng chỉ do trung tâm cấp
  
  -- Score configuration (JSON)
  -- Ví dụ IELTS: {"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"]}
  -- Ví dụ TOEIC: {"type": "numeric", "min": 10, "max": 990, "sub_scores": ["listening", "reading"]}
  -- Ví dụ MOS: {"type": "numeric", "min": 0, "max": 1000, "pass_score": 700}
  score_config JSONB DEFAULT '{}',
  
  -- Template preview
  template_preview_url TEXT, -- Ảnh preview mẫu chứng chỉ
  
  -- Linked courses (có thể cấp từ những khóa học nào)
  linked_course_ids UUID[] DEFAULT '{}',
  
  -- Requirements (điều kiện cấp)
  -- Ví dụ: {"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}
  requirements JSONB DEFAULT '{}',
  
  -- Validity
  validity_months INTEGER, -- Thời hạn hiệu lực (NULL = vĩnh viễn)
  
  -- Center scope
  center_id UUID REFERENCES public.centers(id), -- NULL = system-wide
  
  -- Status
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  
  -- Metadata
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. ALTER BẢNG CERTIFICATES - Thêm các trường mới
-- ============================================================

-- Thêm liên kết với certificate_types
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS certificate_type_id UUID REFERENCES public.certificate_types(id);

-- Thêm trường điểm chi tiết (JSON)
-- Ví dụ IELTS: {"overall": 7.5, "listening": 8.0, "reading": 7.5, "writing": 6.5, "speaking": 7.0}
-- Ví dụ TOEIC: {"total": 850, "listening": 450, "reading": 400}
-- Ví dụ MOS: {"score": 925, "passed": true}
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS scores JSONB DEFAULT '{}';

-- External certificate info
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS external_id TEXT; -- TRF number, Candidate number, etc.

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS external_verify_url TEXT; -- URL verify chứng chỉ

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS exam_date DATE; -- Ngày thi (với chứng chỉ bên ngoài)

-- File attachment (scan chứng chỉ gốc)
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS file_url TEXT; -- URL file scan/PDF

-- Expiry date
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS expires_at DATE; -- Ngày hết hạn

-- Verified by (người xác nhận chứng chỉ)
ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS verified_by UUID REFERENCES public.users(id);

ALTER TABLE public.certificates 
ADD COLUMN IF NOT EXISTS verified_at TIMESTAMPTZ;

-- ============================================================
-- 3. SEED DATA - Các loại chứng chỉ phổ biến
-- ============================================================
INSERT INTO public.certificate_types (code, name, description, provider, category, is_external, is_internal, score_config, requirements, display_order) VALUES

-- Language Certificates (External)
('IELTS', 'IELTS Academic', 'International English Language Testing System - Academic Module', 'British Council / IDP / Cambridge', 'language', true, false, 
 '{"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"], "labels": {"listening": "Listening", "reading": "Reading", "writing": "Writing", "speaking": "Speaking"}}',
 '{}', 1),

('IELTS_GT', 'IELTS General Training', 'International English Language Testing System - General Training Module', 'British Council / IDP / Cambridge', 'language', true, false,
 '{"type": "band", "min": 0, "max": 9, "step": 0.5, "sub_scores": ["listening", "reading", "writing", "speaking"], "labels": {"listening": "Listening", "reading": "Reading", "writing": "Writing", "speaking": "Speaking"}}',
 '{}', 2),

('TOEIC', 'TOEIC Listening & Reading', 'Test of English for International Communication', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 10, "max": 990, "sub_scores": ["listening", "reading"], "labels": {"listening": "Listening", "reading": "Reading"}, "total_label": "Total Score"}',
 '{}', 3),

('TOEIC_SW', 'TOEIC Speaking & Writing', 'Test of English for International Communication - Speaking & Writing', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 0, "max": 400, "sub_scores": ["speaking", "writing"], "labels": {"speaking": "Speaking", "writing": "Writing"}}',
 '{}', 4),

('TOEFL_IBT', 'TOEFL iBT', 'Test of English as a Foreign Language - Internet Based Test', 'ETS', 'language', true, false,
 '{"type": "numeric", "min": 0, "max": 120, "sub_scores": ["reading", "listening", "speaking", "writing"], "labels": {"reading": "Reading", "listening": "Listening", "speaking": "Speaking", "writing": "Writing"}}',
 '{}', 5),

-- Microsoft Office Certificates (External)
('MOS_EXCEL', 'MOS Excel 2019/365', 'Microsoft Office Specialist - Excel', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 10),

('MOS_WORD', 'MOS Word 2019/365', 'Microsoft Office Specialist - Word', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 11),

('MOS_POWERPOINT', 'MOS PowerPoint 2019/365', 'Microsoft Office Specialist - PowerPoint', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 12),

('MOS_EXPERT_EXCEL', 'MOS Expert Excel', 'Microsoft Office Specialist Expert - Excel', 'Microsoft', 'office', true, false,
 '{"type": "numeric", "min": 0, "max": 1000, "pass_score": 700, "labels": {"score": "Score"}}',
 '{}', 13),

-- Internal Certificates (do trung tâm cấp)
('EXCEL_BASIC', 'Excel Cơ bản', 'Chứng chỉ hoàn thành khóa Excel cơ bản', NULL, 'office', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}', 20),

('EXCEL_ADVANCED', 'Excel Nâng cao', 'Chứng chỉ hoàn thành khóa Excel nâng cao (Pivot, VBA, Dashboard)', NULL, 'office', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}', 21),

('IELTS_PREP', 'IELTS Preparation', 'Chứng chỉ hoàn thành khóa luyện thi IELTS', NULL, 'language', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 22),

('TOEIC_PREP', 'TOEIC Preparation', 'Chứng chỉ hoàn thành khóa luyện thi TOEIC', NULL, 'language', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 23),

('COMMUNICATION', 'Kỹ năng Giao tiếp', 'Chứng chỉ hoàn thành khóa Kỹ năng giao tiếp chuyên nghiệp', NULL, 'soft_skill', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 30),

('PRESENTATION', 'Kỹ năng Thuyết trình', 'Chứng chỉ hoàn thành khóa Kỹ năng thuyết trình', NULL, 'soft_skill', false, true,
 '{"type": "grade", "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"], "min_grade": 5.0}',
 '{"min_attendance": 80, "min_grade": 5.0}', 31)

ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  provider = EXCLUDED.provider,
  category = EXCLUDED.category,
  is_external = EXCLUDED.is_external,
  is_internal = EXCLUDED.is_internal,
  score_config = EXCLUDED.score_config,
  requirements = EXCLUDED.requirements,
  display_order = EXCLUDED.display_order,
  updated_at = NOW();

-- ============================================================
-- 4. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificate_types_code ON public.certificate_types(code);
CREATE INDEX IF NOT EXISTS idx_certificate_types_category ON public.certificate_types(category);
CREATE INDEX IF NOT EXISTS idx_certificate_types_is_active ON public.certificate_types(is_active);
CREATE INDEX IF NOT EXISTS idx_certificate_types_center ON public.certificate_types(center_id);

CREATE INDEX IF NOT EXISTS idx_certificates_type ON public.certificates(certificate_type_id);
CREATE INDEX IF NOT EXISTS idx_certificates_expires ON public.certificates(expires_at);

-- ============================================================
-- 5. VIEW - Certificate Statistics by Type
-- ============================================================
CREATE OR REPLACE VIEW public.certificate_type_stats AS
SELECT 
  ct.id,
  ct.code,
  ct.name,
  ct.category,
  ct.provider,
  ct.is_external,
  ct.is_internal,
  ct.template_preview_url,
  ct.display_order,
  ct.is_active,
  COUNT(c.id) AS total_issued,
  COUNT(CASE WHEN c.status = 'issued' THEN 1 END) AS active_count,
  COUNT(CASE WHEN c.status = 'revoked' THEN 1 END) AS revoked_count,
  COUNT(CASE WHEN c.issued_at >= NOW() - INTERVAL '30 days' THEN 1 END) AS issued_last_30_days,
  MAX(c.issued_at) AS last_issued_at
FROM public.certificate_types ct
LEFT JOIN public.certificates c ON c.certificate_type_id = ct.id
WHERE ct.is_active = true
GROUP BY ct.id
ORDER BY ct.display_order, ct.name;

-- ============================================================
-- 6. RLS POLICIES
-- ============================================================
ALTER TABLE public.certificate_types ENABLE ROW LEVEL SECURITY;

-- Policy: Authenticated users can read active certificate types
CREATE POLICY "certificate_types_read_policy" ON public.certificate_types
  FOR SELECT TO authenticated
  USING (is_active = true OR auth.uid() IN (
    SELECT u.id FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  ));

-- Policy: Only admins can modify certificate types
CREATE POLICY "certificate_types_admin_policy" ON public.certificate_types
  FOR ALL TO authenticated
  USING (auth.uid() IN (
    SELECT u.id FROM public.users u 
    JOIN public.roles r ON u.role_id = r.id 
    WHERE r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
  ));

-- ============================================================
-- 7. FUNCTION - Generate Certificate Number
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number(type_code TEXT DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
  prefix TEXT;
  year_part TEXT;
  seq_num INTEGER;
  new_number TEXT;
BEGIN
  -- Prefix based on type
  IF type_code IS NOT NULL THEN
    prefix := UPPER(LEFT(type_code, 4));
  ELSE
    prefix := 'CERT';
  END IF;
  
  -- Year part
  year_part := TO_CHAR(NOW(), 'YYYY');
  
  -- Get next sequence number
  SELECT COALESCE(MAX(
    CAST(NULLIF(REGEXP_REPLACE(certificate_number, '[^0-9]', '', 'g'), '') AS INTEGER)
  ), 0) + 1
  INTO seq_num
  FROM public.certificates
  WHERE certificate_number LIKE prefix || '-' || year_part || '-%';
  
  -- Format: TYPE-YYYY-NNNN
  new_number := prefix || '-' || year_part || '-' || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_number;
END;
$$ LANGUAGE plpgsql;

COMMENT ON TABLE public.certificate_types IS 'Bảng master data các loại chứng chỉ (IELTS, TOEIC, MOS, Internal certificates)';
COMMENT ON TABLE public.certificates IS 'Bảng chứng chỉ đã cấp cho học viên';
