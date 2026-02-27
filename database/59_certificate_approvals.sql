-- Migration: Certificate Approval Workflow + New Certificate Types
-- Adds approval workflow support and additional certificate types (VSTEP, APTIS, ICDL, CNTT)

-- 1. Create certificate_approvals table
CREATE TABLE IF NOT EXISTS public.certificate_approvals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_ids UUID[] NOT NULL, -- Array of certificate IDs in this approval batch
    requested_by UUID NOT NULL REFERENCES auth.users(id),
    requested_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'auto_approved')),
    approved_by UUID REFERENCES auth.users(id),
    approved_at TIMESTAMPTZ,
    rejected_by UUID REFERENCES auth.users(id),
    rejected_at TIMESTAMPTZ,
    rejection_reason TEXT,
    notes TEXT,
    certificate_type_id UUID REFERENCES public.certificate_types(id),
    center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Add approval_status column to certificates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'approval_status'
    ) THEN
        ALTER TABLE public.certificates 
        ADD COLUMN approval_status TEXT NOT NULL DEFAULT 'auto_approved' 
        CHECK (approval_status IN ('pending_approval', 'approved', 'auto_approved', 'rejected'));
    END IF;
END $$;

-- 3. Add approval_id column to certificates table
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public' AND table_name = 'certificates' AND column_name = 'approval_id'
    ) THEN
        ALTER TABLE public.certificates 
        ADD COLUMN approval_id UUID REFERENCES public.certificate_approvals(id);
    END IF;
END $$;

-- 4. Indexes for certificate_approvals
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_center_id ON public.certificate_approvals(center_id);
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_status ON public.certificate_approvals(status);
CREATE INDEX IF NOT EXISTS idx_certificate_approvals_requested_by ON public.certificate_approvals(requested_by);
CREATE INDEX IF NOT EXISTS idx_certificates_approval_status ON public.certificates(approval_status);

-- 5. RLS for certificate_approvals
ALTER TABLE public.certificate_approvals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "certificate_approvals_center_isolation" ON public.certificate_approvals
    USING (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc WHERE uc.user_id = auth.uid()
    ));

CREATE POLICY "certificate_approvals_insert" ON public.certificate_approvals
    FOR INSERT WITH CHECK (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc WHERE uc.user_id = auth.uid()
    ));

CREATE POLICY "certificate_approvals_update" ON public.certificate_approvals
    FOR UPDATE USING (center_id IN (
        SELECT uc.center_id FROM public.user_centers uc 
        WHERE uc.user_id = auth.uid() 
        AND uc.role IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    ));

-- 6. Seed additional certificate types (VSTEP, APTIS, ICDL, CNTT)
INSERT INTO public.certificate_types (code, name, description, provider, category, is_external, is_internal, score_config, requirements, validity_months, display_order, is_active)
VALUES
    -- VSTEP - Vietnamese Standardized Test of English Proficiency
    ('VSTEP', 'VSTEP', 'Bài thi năng lực ngoại ngữ theo Khung năng lực ngoại ngữ 6 bậc dùng cho Việt Nam', 'Bộ Giáo dục và Đào tạo', 'language', true, false,
     '{"type": "numeric", "max_score": 10, "min_score": 0, "pass_score": 4, "sub_scores": ["Listening", "Reading", "Writing", "Speaking"], "levels": [{"min": 4, "max": 5.5, "level": "B1"}, {"min": 6, "max": 7.5, "level": "B2"}, {"min": 8, "max": 10, "level": "C1"}]}'::jsonb,
     '{"description": "Đăng ký thi tại các cơ sở được Bộ GD&ĐT cấp phép"}'::jsonb,
     24, 15, true),
    
    -- APTIS - British Council
    ('APTIS', 'Aptis', 'Bài kiểm tra năng lực tiếng Anh của British Council', 'British Council', 'language', true, false,
     '{"type": "numeric", "max_score": 50, "min_score": 0, "sub_scores": ["Listening", "Reading", "Writing", "Speaking", "Grammar & Vocabulary"], "levels": [{"min": 0, "max": 19, "level": "A1"}, {"min": 20, "max": 29, "level": "A2"}, {"min": 30, "max": 39, "level": "B1"}, {"min": 40, "max": 44, "level": "B2"}, {"min": 45, "max": 50, "level": "C"}]}'::jsonb,
     '{"description": "Thi tại các trung tâm được British Council ủy quyền"}'::jsonb,
     24, 16, true),
    
    -- ICDL - International Computer Driving Licence
    ('ICDL', 'ICDL', 'Chứng chỉ tin học quốc tế ICDL (trước đây là ECDL)', 'ICDL Foundation', 'office', true, false,
     '{"type": "numeric", "max_score": 100, "min_score": 0, "pass_score": 75, "sub_scores": ["Computer Essentials", "Online Essentials", "Word Processing", "Spreadsheets", "Presentation", "Using Databases", "IT Security"]}'::jsonb,
     '{"description": "Thi tại các trung tâm khảo thí ICDL được ủy quyền"}'::jsonb,
     NULL, 25, true),
    
    -- Tin học ứng dụng CNTT - Thông tư 03/2014
    ('CNTT_UD', 'Tin học ứng dụng CNTT', 'Chứng chỉ ứng dụng CNTT theo Thông tư 03/2014/TT-BTTTT', 'Bộ Thông tin và Truyền thông', 'office', true, false,
     '{"type": "grade", "grades": ["Cơ bản", "Nâng cao"], "sub_scores": ["Kiến thức chung về CNTT", "Sử dụng máy tính cơ bản", "Xử lý văn bản", "Bảng tính", "Trình chiếu", "Internet"]}'::jsonb,
     '{"description": "Thi tại các cơ sở được Bộ TT&TT cấp phép tổ chức thi"}'::jsonb,
     NULL, 26, true)
ON CONFLICT (code) DO NOTHING;

-- 7. Updated_at trigger for certificate_approvals
CREATE OR REPLACE FUNCTION update_certificate_approvals_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_certificate_approvals_updated_at ON public.certificate_approvals;
CREATE TRIGGER trigger_certificate_approvals_updated_at
    BEFORE UPDATE ON public.certificate_approvals
    FOR EACH ROW
    EXECUTE FUNCTION update_certificate_approvals_updated_at();
