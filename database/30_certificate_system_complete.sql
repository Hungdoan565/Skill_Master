-- ============================================================
-- SKILL MASTER - CERTIFICATE SYSTEM COMPLETE
-- Version: 2.0
-- Hệ thống chứng chỉ hoàn chỉnh cho Trung tâm Anh ngữ & Tin học
-- ============================================================

-- ============================================================
-- 1. THÊM CÁC LOẠI CHỨNG CHỈ MỚI
-- ============================================================

-- Delete old seed data để insert lại với design mới
DELETE FROM public.certificate_types WHERE id IS NOT NULL;

-- Insert comprehensive certificate types cho Anh ngữ & Tin học
INSERT INTO public.certificate_types (
    code, name, description, provider, category, 
    is_external, is_internal, score_config, requirements, 
    validity_months, display_order, is_active
) VALUES

-- ============================================================
-- A. CHỨNG CHỈ ANH NGỮ QUỐC TẾ (External - Bên ngoài)
-- ============================================================
('IELTS_AC', 'IELTS Academic', 
 'Chứng chỉ IELTS Academic - Dành cho học thuật, du học, định cư', 
 'British Council / IDP / Cambridge', 'language', true, false,
 '{
    "type": "band",
    "min": 0,
    "max": 9,
    "step": 0.5,
    "sub_scores": ["listening", "reading", "writing", "speaking"],
    "labels": {
        "listening": "Listening",
        "reading": "Reading", 
        "writing": "Writing",
        "speaking": "Speaking"
    },
    "levels": {
        "9": "Expert",
        "8": "Very Good",
        "7": "Good",
        "6": "Competent",
        "5": "Modest",
        "4": "Limited"
    }
 }',
 '{}',
 24, 1, true),

('IELTS_GT', 'IELTS General Training', 
 'Chứng chỉ IELTS General Training - Dành cho di trú, công việc', 
 'British Council / IDP / Cambridge', 'language', true, false,
 '{
    "type": "band",
    "min": 0,
    "max": 9,
    "step": 0.5,
    "sub_scores": ["listening", "reading", "writing", "speaking"],
    "labels": {
        "listening": "Listening",
        "reading": "Reading",
        "writing": "Writing", 
        "speaking": "Speaking"
    }
 }',
 '{}',
 24, 2, true),

('TOEIC_LR', 'TOEIC Listening & Reading', 
 'Chứng chỉ TOEIC Listening & Reading - Tiêu chuẩn doanh nghiệp', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 10,
    "max": 990,
    "sub_scores": ["listening", "reading"],
    "labels": {
        "listening": "Listening (5-495)",
        "reading": "Reading (5-495)"
    },
    "total_label": "Total Score",
    "levels": {
        "905": "International Professional Proficiency",
        "785": "Working Proficiency Plus",
        "605": "Limited Working Proficiency",
        "405": "Elementary Proficiency Plus"
    }
 }',
 '{}',
 24, 3, true),

('TOEIC_SW', 'TOEIC Speaking & Writing', 
 'Chứng chỉ TOEIC Speaking & Writing', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 400,
    "sub_scores": ["speaking", "writing"],
    "labels": {
        "speaking": "Speaking (0-200)",
        "writing": "Writing (0-200)"
    }
 }',
 '{}',
 24, 4, true),

('TOEFL_IBT', 'TOEFL iBT', 
 'Chứng chỉ TOEFL Internet-Based Test', 
 'ETS (Educational Testing Service)', 'language', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 120,
    "sub_scores": ["reading", "listening", "speaking", "writing"],
    "labels": {
        "reading": "Reading (0-30)",
        "listening": "Listening (0-30)",
        "speaking": "Speaking (0-30)",
        "writing": "Writing (0-30)"
    },
    "total_label": "Total Score"
 }',
 '{}',
 24, 5, true),

('CAMBRIDGE_KET', 'Cambridge KET (A2 Key)', 
 'Chứng chỉ Cambridge A2 Key - Trình độ cơ bản', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 100,
    "max": 150,
    "pass_score": 120,
    "grades": ["Pass with Distinction", "Pass with Merit", "Pass", "Fail"]
 }',
 '{}',
 null, 6, true),

('CAMBRIDGE_PET', 'Cambridge PET (B1 Preliminary)', 
 'Chứng chỉ Cambridge B1 Preliminary - Trình độ trung cấp', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 120,
    "max": 170,
    "pass_score": 140,
    "grades": ["Pass with Distinction", "Pass with Merit", "Pass", "Fail"]
 }',
 '{}',
 null, 7, true),

('CAMBRIDGE_FCE', 'Cambridge FCE (B2 First)', 
 'Chứng chỉ Cambridge B2 First - Trình độ cao cấp', 
 'Cambridge Assessment English', 'language', true, false,
 '{
    "type": "numeric",
    "min": 140,
    "max": 190,
    "pass_score": 160,
    "grades": ["Grade A (C1)", "Grade B", "Grade C", "Fail"]
 }',
 '{}',
 null, 8, true),

-- ============================================================
-- B. CHỨNG CHỈ TIN HỌC QUỐC TẾ (External - Bên ngoài)
-- ============================================================
('MOS_WORD', 'MOS Word 365/2019', 
 'Microsoft Office Specialist - Word Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 20, true),

('MOS_EXCEL', 'MOS Excel 365/2019', 
 'Microsoft Office Specialist - Excel Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 21, true),

('MOS_POWERPOINT', 'MOS PowerPoint 365/2019', 
 'Microsoft Office Specialist - PowerPoint Associate', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 22, true),

('MOS_EXCEL_EXPERT', 'MOS Excel Expert', 
 'Microsoft Office Specialist Expert - Excel', 
 'Microsoft / Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "labels": {"score": "Score"}
 }',
 '{}',
 null, 23, true),

('IC3_GS6', 'IC3 Digital Literacy GS6', 
 'Chứng chỉ Tin học Văn phòng Quốc tế IC3', 
 'Certiport', 'office', true, false,
 '{
    "type": "numeric",
    "min": 0,
    "max": 1000,
    "pass_score": 700,
    "sub_scores": ["computing_fundamentals", "key_applications", "living_online"],
    "labels": {
        "computing_fundamentals": "Computing Fundamentals",
        "key_applications": "Key Applications",
        "living_online": "Living Online"
    }
 }',
 '{}',
 null, 24, true),

-- ============================================================
-- C. CHỨNG CHỈ NỘI BỘ - ANH NGỮ (Internal - Trung tâm cấp)
-- ============================================================
('ENGLISH_STARTER', 'English Starter (Pre-A1)', 
 'Chứng chỉ hoàn thành khóa Anh ngữ Khởi đầu', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "grade_colors": {
        "Xuất sắc": "#FFD700",
        "Giỏi": "#C0C0C0",
        "Khá": "#CD7F32",
        "Đạt": "#4CAF50"
    }
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 40, true),

('ENGLISH_A1', 'English Elementary (A1)', 
 'Chứng chỉ Anh ngữ trình độ A1 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 41, true),

('ENGLISH_A2', 'English Pre-Intermediate (A2)', 
 'Chứng chỉ Anh ngữ trình độ A2 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 42, true),

('ENGLISH_B1', 'English Intermediate (B1)', 
 'Chứng chỉ Anh ngữ trình độ B1 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 43, true),

('ENGLISH_B2', 'English Upper-Intermediate (B2)', 
 'Chứng chỉ Anh ngữ trình độ B2 theo CEFR', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "skills": ["Listening", "Speaking", "Reading", "Writing"]
 }',
 '{"min_attendance": 80, "min_grade": 6.5, "require_final_exam": true}',
 null, 44, true),

('IELTS_PREP', 'IELTS Preparation Course', 
 'Chứng chỉ hoàn thành khóa Luyện thi IELTS', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "target_band": true
 }',
 '{"min_attendance": 85, "min_grade": 5.0}',
 null, 45, true),

('TOEIC_PREP', 'TOEIC Preparation Course', 
 'Chứng chỉ hoàn thành khóa Luyện thi TOEIC', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "target_score": true
 }',
 '{"min_attendance": 85, "min_grade": 5.0}',
 null, 46, true),

('BUSINESS_ENGLISH', 'Business English', 
 'Chứng chỉ hoàn thành khóa Tiếng Anh Thương mại', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 47, true),

('ENGLISH_COMMUNICATION', 'English Communication', 
 'Chứng chỉ hoàn thành khóa Giao tiếp Tiếng Anh', 
 null, 'language', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 48, true),

-- ============================================================
-- D. CHỨNG CHỈ NỘI BỘ - TIN HỌC (Internal - Trung tâm cấp)
-- ============================================================
('OFFICE_BASIC', 'Tin học Văn phòng Cơ bản', 
 'Chứng chỉ hoàn thành khóa Tin học Văn phòng cơ bản (Word, Excel, PowerPoint)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "modules": ["Word", "Excel", "PowerPoint"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 60, true),

('EXCEL_BASIC', 'Excel Cơ bản', 
 'Chứng chỉ hoàn thành khóa Excel cơ bản', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 61, true),

('EXCEL_ADVANCED', 'Excel Nâng cao', 
 'Chứng chỉ hoàn thành khóa Excel nâng cao (Pivot, Dashboard, VBA)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"],
    "modules": ["Pivot Table", "Dashboard", "VBA Macro"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 62, true),

('EXCEL_DATA_ANALYSIS', 'Excel Data Analysis', 
 'Chứng chỉ hoàn thành khóa Phân tích dữ liệu với Excel', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_final_exam": true}',
 null, 63, true),

('WORD_ADVANCED', 'Word Nâng cao', 
 'Chứng chỉ hoàn thành khóa Word nâng cao (Mail Merge, Template, Automation)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 64, true),

('POWERPOINT_DESIGN', 'PowerPoint Design', 
 'Chứng chỉ hoàn thành khóa Thiết kế Slide chuyên nghiệp', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 65, true),

('GOOGLE_WORKSPACE', 'Google Workspace', 
 'Chứng chỉ hoàn thành khóa Google Workspace (Docs, Sheets, Slides)', 
 null, 'office', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true}',
 null, 66, true),

-- ============================================================
-- E. CHỨNG CHỈ LẬP TRÌNH (Programming)
-- ============================================================
('PYTHON_BASIC', 'Python Cơ bản', 
 'Chứng chỉ hoàn thành khóa Lập trình Python cơ bản', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_final_exam": true, "require_project": true}',
 null, 80, true),

('PYTHON_DATA', 'Python for Data Science', 
 'Chứng chỉ hoàn thành khóa Python cho Khoa học dữ liệu', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 6.0, "require_project": true}',
 null, 81, true),

('WEB_FRONTEND', 'Web Frontend Development', 
 'Chứng chỉ hoàn thành khóa Lập trình Web Frontend (HTML, CSS, JavaScript)', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_project": true}',
 null, 82, true),

('GRAPHIC_DESIGN', 'Graphic Design Fundamentals', 
 'Chứng chỉ hoàn thành khóa Thiết kế đồ họa cơ bản (Photoshop, Illustrator)', 
 null, 'programming', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0, "require_project": true}',
 null, 83, true),

-- ============================================================
-- F. KỸ NĂNG MỀM (Soft Skills)
-- ============================================================
('PRESENTATION_SKILLS', 'Kỹ năng Thuyết trình', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Thuyết trình chuyên nghiệp', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 100, true),

('COMMUNICATION_SKILLS', 'Kỹ năng Giao tiếp', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Giao tiếp hiệu quả', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 101, true),

('TEAMWORK_SKILLS', 'Kỹ năng Làm việc nhóm', 
 'Chứng chỉ hoàn thành khóa Kỹ năng Làm việc nhóm', 
 null, 'soft_skill', false, true,
 '{
    "type": "grade",
    "grades": ["Xuất sắc", "Giỏi", "Khá", "Đạt"]
 }',
 '{"min_attendance": 80, "min_grade": 5.0}',
 null, 102, true);

-- ============================================================
-- 2. THÊM BẢNG CERTIFICATE_DESIGNS (Mẫu thiết kế chứng chỉ)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_designs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    
    -- Basic info
    name TEXT NOT NULL,
    description TEXT,
    
    -- Design template (CSS + HTML variables)
    design_config JSONB NOT NULL DEFAULT '{
        "size": "A4",
        "orientation": "landscape",
        "background": {
            "type": "gradient",
            "colors": ["#f8fafc", "#e2e8f0"]
        },
        "border": {
            "style": "double",
            "color": "#d4af37",
            "width": 8
        },
        "colors": {
            "primary": "#1e40af",
            "secondary": "#d4af37",
            "text": "#1e293b",
            "accent": "#0891b2"
        },
        "fonts": {
            "title": "Playfair Display",
            "body": "Inter",
            "script": "Dancing Script"
        }
    }',
    
    -- Background image URL (optional)
    background_url TEXT,
    
    -- Logo positions
    logo_config JSONB DEFAULT '{
        "center_logo": true,
        "provider_logo": false
    }',
    
    -- Linked certificate types (which types can use this design)
    certificate_type_ids UUID[] DEFAULT '{}',
    
    -- Category specific (language, office, etc.)
    category TEXT CHECK (category IN ('language', 'office', 'programming', 'soft_skill', 'other', 'all')),
    
    -- Preview image
    preview_url TEXT,
    
    -- Is default for category
    is_default BOOLEAN DEFAULT false,
    
    -- Status
    is_active BOOLEAN DEFAULT true,
    
    center_id UUID REFERENCES public.centers(id),
    created_by UUID REFERENCES public.users(id),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. SEED CERTIFICATE DESIGNS
-- ============================================================
INSERT INTO public.certificate_designs (name, description, category, is_default, design_config) VALUES

-- Classic Gold Design (Anh ngữ)
('Classic Gold - Anh ngữ', 
 'Thiết kế cổ điển với viền vàng sang trọng, phù hợp cho chứng chỉ Anh ngữ', 
 'language', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#fffbeb", "#fef3c7"]
    },
    "border": {
        "style": "ornate",
        "color": "#d4af37",
        "width": 12,
        "pattern": "greek_key"
    },
    "colors": {
        "primary": "#1e40af",
        "secondary": "#d4af37",
        "text": "#1e293b",
        "accent": "#7c3aed"
    },
    "fonts": {
        "title": "Playfair Display",
        "name": "Great Vibes",
        "body": "Cormorant Garamond"
    },
    "decorations": {
        "corner_ornaments": true,
        "seal": true,
        "ribbon": false
    }
 }'),

-- Modern Blue Design (Tin học)
('Modern Blue - Tin học', 
 'Thiết kế hiện đại với tông màu xanh công nghệ', 
 'office', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#f0f9ff", "#e0f2fe"]
    },
    "border": {
        "style": "modern",
        "color": "#0284c7",
        "width": 4
    },
    "colors": {
        "primary": "#0369a1",
        "secondary": "#0891b2",
        "text": "#0f172a",
        "accent": "#06b6d4"
    },
    "fonts": {
        "title": "Montserrat",
        "name": "Poppins",
        "body": "Inter"
    },
    "decorations": {
        "corner_ornaments": false,
        "seal": true,
        "ribbon": false,
        "tech_pattern": true
    }
 }'),

-- Professional Purple (Lập trình)
('Professional Purple - Programming', 
 'Thiết kế chuyên nghiệp tông tím cho chứng chỉ IT', 
 'programming', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#faf5ff", "#f3e8ff"]
    },
    "border": {
        "style": "code",
        "color": "#7c3aed",
        "width": 6
    },
    "colors": {
        "primary": "#6d28d9",
        "secondary": "#8b5cf6",
        "text": "#1e1b4b",
        "accent": "#a855f7"
    },
    "fonts": {
        "title": "JetBrains Mono",
        "name": "Outfit",
        "body": "Inter"
    },
    "decorations": {
        "code_pattern": true,
        "seal": true
    }
 }'),

-- Elegant Warm (Kỹ năng mềm)
('Elegant Warm - Soft Skills', 
 'Thiết kế ấm áp, thân thiện cho chứng chỉ kỹ năng mềm', 
 'soft_skill', true,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "gradient",
        "colors": ["#fff7ed", "#ffedd5"]
    },
    "border": {
        "style": "flowing",
        "color": "#ea580c",
        "width": 6
    },
    "colors": {
        "primary": "#c2410c",
        "secondary": "#ea580c",
        "text": "#431407",
        "accent": "#f97316"
    },
    "fonts": {
        "title": "Merriweather",
        "name": "Satisfy",
        "body": "Lora"
    },
    "decorations": {
        "floral_ornaments": true,
        "seal": true
    }
 }'),

-- Premium Gold (External Certificates)
('Premium Gold - External', 
 'Thiết kế cao cấp cho chứng chỉ quốc tế', 
 'all', false,
 '{
    "size": "A4",
    "orientation": "landscape",
    "background": {
        "type": "solid",
        "color": "#fefce8"
    },
    "border": {
        "style": "premium",
        "color": "#b45309",
        "width": 16,
        "inner_color": "#fbbf24"
    },
    "colors": {
        "primary": "#92400e",
        "secondary": "#d97706",
        "text": "#422006",
        "accent": "#fbbf24"
    },
    "fonts": {
        "title": "Cinzel",
        "name": "Alex Brush",
        "body": "EB Garamond"
    },
    "decorations": {
        "corner_ornaments": true,
        "seal": true,
        "ribbon": true,
        "watermark": true
    }
 }');

-- ============================================================
-- 4. FUNCTION - Sinh số chứng chỉ có format đẹp
-- ============================================================
CREATE OR REPLACE FUNCTION public.generate_certificate_number_v2(
    p_type_code TEXT,
    p_center_code TEXT DEFAULT 'SM'
)
RETURNS TEXT AS $$
DECLARE
    prefix TEXT;
    year_part TEXT;
    month_part TEXT;
    seq_num INTEGER;
    new_number TEXT;
BEGIN
    -- Build prefix: CENTER-TYPE
    prefix := UPPER(COALESCE(p_center_code, 'SM'));
    
    -- Year and month
    year_part := TO_CHAR(NOW(), 'YYYY');
    month_part := TO_CHAR(NOW(), 'MM');
    
    -- Get next sequence for this month
    SELECT COUNT(*) + 1
    INTO seq_num
    FROM public.certificates
    WHERE certificate_number LIKE prefix || '-' || year_part || month_part || '-%'
    AND created_at >= DATE_TRUNC('month', NOW());
    
    -- Format: SM-202412-0001
    new_number := prefix || '-' || year_part || month_part || '-' || LPAD(seq_num::TEXT, 4, '0');
    
    RETURN new_number;
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 5. ADD DESIGN_ID TO CERTIFICATES
-- ============================================================
ALTER TABLE public.certificates
ADD COLUMN IF NOT EXISTS design_id UUID REFERENCES public.certificate_designs(id);

-- ============================================================
-- 6. INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_certificate_designs_category ON public.certificate_designs(category);
CREATE INDEX IF NOT EXISTS idx_certificate_designs_is_default ON public.certificate_designs(is_default);
CREATE INDEX IF NOT EXISTS idx_certificate_designs_is_active ON public.certificate_designs(is_active);

-- ============================================================
-- 7. COMMENTS
-- ============================================================
COMMENT ON TABLE public.certificate_designs IS 'Bảng lưu các mẫu thiết kế chứng chỉ';
COMMENT ON COLUMN public.certificate_designs.design_config IS 'JSON config cho design: colors, fonts, border, decorations';
