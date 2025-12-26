-- ============================================
-- Migration: Assessment/Placement Test System
-- Author: Skill Master Team
-- Date: 2024-12-26
-- Description: Tables for online placement tests
-- ============================================

-- ============================================
-- 1. ASSESSMENT TESTS (Test categories)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_tests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('ielts', 'toeic', 'office', 'general')),
    description TEXT,
    short_description VARCHAR(255),
    icon_name VARCHAR(50) DEFAULT 'BookOpen',
    duration_minutes INT DEFAULT 30,
    total_questions INT DEFAULT 30,
    passing_percentage INT DEFAULT 60,
    is_active BOOLEAN DEFAULT true,
    is_featured BOOLEAN DEFAULT false,
    attempts_allowed INT DEFAULT 1, -- NULL = unlimited
    cooldown_hours INT DEFAULT 24, -- Hours between attempts
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 2. ASSESSMENT QUESTIONS (Question bank)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_questions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    question_text TEXT NOT NULL,
    question_type VARCHAR(20) DEFAULT 'single' CHECK (question_type IN ('single', 'multiple', 'fill', 'true_false')),
    options JSONB NOT NULL DEFAULT '[]', -- ["Option A", "Option B", "Option C", "Option D"]
    correct_answer JSONB NOT NULL, -- ["A"] for single, ["A", "C"] for multiple
    difficulty INT DEFAULT 1 CHECK (difficulty BETWEEN 1 AND 5), -- 1=Easy, 5=Hard
    skill_area VARCHAR(50), -- 'listening', 'reading', 'grammar', 'vocabulary'
    points INT DEFAULT 1,
    explanation TEXT, -- Shown after completion
    media_url TEXT, -- Audio/Image URL if needed
    order_index INT DEFAULT 0,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 3. ASSESSMENT ATTEMPTS (User submissions)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL, -- NULL for guests
    
    -- Guest info (if not logged in)
    guest_email VARCHAR(255),
    guest_name VARCHAR(255),
    guest_phone VARCHAR(20),
    
    -- Test session
    questions_order JSONB, -- Randomized question IDs for this attempt
    answers JSONB DEFAULT '{}', -- {question_id: "selected_answer"}
    
    -- Scoring
    score INT DEFAULT 0,
    max_score INT DEFAULT 0,
    percentage DECIMAL(5,2) DEFAULT 0,
    result_level VARCHAR(20), -- 'A1', 'A2', 'B1', 'B2', 'C1'
    result_level_name VARCHAR(100),
    
    -- Timing
    time_limit_seconds INT,
    time_spent_seconds INT DEFAULT 0,
    started_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    
    -- Security tracking
    ip_address INET,
    user_agent TEXT,
    browser_fingerprint VARCHAR(255),
    tab_switches INT DEFAULT 0, -- Anti-cheat: count focus losses
    
    -- Status
    status VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned', 'timed_out')),
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 4. ASSESSMENT RESULTS MAPPING (Score → Level)
-- ============================================
CREATE TABLE IF NOT EXISTS public.assessment_results_mapping (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_id UUID NOT NULL REFERENCES public.assessment_tests(id) ON DELETE CASCADE,
    min_percentage INT NOT NULL,
    max_percentage INT NOT NULL,
    level_code VARCHAR(20) NOT NULL, -- 'A1', 'A2', 'B1', 'B2', 'C1', 'C2'
    level_name VARCHAR(100) NOT NULL, -- 'Sơ cấp', 'Trung cấp', etc.
    description TEXT,
    recommended_courses JSONB DEFAULT '[]', -- [course_id1, course_id2]
    display_color VARCHAR(20) DEFAULT '#3b82f6', -- For UI badge
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- 5. INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX IF NOT EXISTS idx_assessment_questions_test_id ON public.assessment_questions(test_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_difficulty ON public.assessment_questions(difficulty);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_test_id ON public.assessment_attempts(test_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_user_id ON public.assessment_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_guest_email ON public.assessment_attempts(guest_email);
CREATE INDEX IF NOT EXISTS idx_assessment_attempts_status ON public.assessment_attempts(status);
CREATE INDEX IF NOT EXISTS idx_assessment_results_mapping_test_id ON public.assessment_results_mapping(test_id);

-- ============================================
-- 6. RLS POLICIES
-- ============================================

-- Enable RLS
ALTER TABLE public.assessment_tests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessment_results_mapping ENABLE ROW LEVEL SECURITY;

-- Tests: Anyone can read active tests
CREATE POLICY "Anyone can view active tests"
    ON public.assessment_tests FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage tests"
    ON public.assessment_tests FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- Questions: Only show during active attempt (prevent pre-fetching)
CREATE POLICY "Anyone can view questions for attempts"
    ON public.assessment_questions FOR SELECT
    USING (is_active = true);

CREATE POLICY "Admins can manage questions"
    ON public.assessment_questions FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- Attempts: Users can manage their own attempts
CREATE POLICY "Anyone can create attempts"
    ON public.assessment_attempts FOR INSERT
    WITH CHECK (true);

CREATE POLICY "Users can view own attempts"
    ON public.assessment_attempts FOR SELECT
    USING (
        user_id = auth.uid() 
        OR guest_email IS NOT NULL -- Guests can view by attempt ID
    );

CREATE POLICY "Users can update own in-progress attempts"
    ON public.assessment_attempts FOR UPDATE
    USING (
        (user_id = auth.uid() OR user_id IS NULL)
        AND status = 'in_progress'
    );

CREATE POLICY "Admins can view all attempts"
    ON public.assessment_attempts FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
        )
    );

-- Results mapping: Anyone can read
CREATE POLICY "Anyone can view results mapping"
    ON public.assessment_results_mapping FOR SELECT
    USING (true);

CREATE POLICY "Admins can manage results mapping"
    ON public.assessment_results_mapping FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM public.users p
            JOIN public.roles r ON p.role_id = r.id
            WHERE p.id = auth.uid() AND r.code = 'SUPER_ADMIN'
        )
    );

-- ============================================
-- 7. FUNCTIONS
-- ============================================

-- Function to start a new attempt with randomized questions
CREATE OR REPLACE FUNCTION public.start_assessment_attempt(
    p_test_id UUID,
    p_user_id UUID DEFAULT NULL,
    p_guest_email VARCHAR DEFAULT NULL,
    p_guest_name VARCHAR DEFAULT NULL,
    p_guest_phone VARCHAR DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt_id UUID;
    v_test RECORD;
    v_questions_order JSONB;
    v_existing_attempt RECORD;
BEGIN
    -- Get test info
    SELECT * INTO v_test FROM public.assessment_tests WHERE id = p_test_id AND is_active = true;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Test not found or inactive';
    END IF;
    
    -- Check for existing in-progress attempt
    SELECT * INTO v_existing_attempt 
    FROM public.assessment_attempts 
    WHERE test_id = p_test_id 
      AND status = 'in_progress'
      AND (
          (p_user_id IS NOT NULL AND user_id = p_user_id)
          OR (p_guest_email IS NOT NULL AND guest_email = p_guest_email)
      );
    
    IF FOUND THEN
        -- Return existing attempt
        RETURN v_existing_attempt.id;
    END IF;
    
    -- Check cooldown for completed attempts
    IF v_test.cooldown_hours IS NOT NULL THEN
        IF EXISTS (
            SELECT 1 FROM public.assessment_attempts
            WHERE test_id = p_test_id
              AND status = 'completed'
              AND completed_at > NOW() - (v_test.cooldown_hours || ' hours')::INTERVAL
              AND (
                  (p_user_id IS NOT NULL AND user_id = p_user_id)
                  OR (p_guest_email IS NOT NULL AND guest_email = p_guest_email)
              )
        ) THEN
            RAISE EXCEPTION 'Please wait before attempting this test again';
        END IF;
    END IF;
    
    -- Get randomized questions
    SELECT jsonb_agg(id ORDER BY RANDOM()) INTO v_questions_order
    FROM (
        SELECT id FROM public.assessment_questions
        WHERE test_id = p_test_id AND is_active = true
        LIMIT v_test.total_questions
    ) q;
    
    -- Create attempt
    INSERT INTO public.assessment_attempts (
        test_id, user_id, guest_email, guest_name, guest_phone,
        questions_order, time_limit_seconds, max_score
    ) VALUES (
        p_test_id, p_user_id, p_guest_email, p_guest_name, p_guest_phone,
        v_questions_order, v_test.duration_minutes * 60, v_test.total_questions
    ) RETURNING id INTO v_attempt_id;
    
    RETURN v_attempt_id;
END;
$$;

-- Function to submit an attempt and calculate score
CREATE OR REPLACE FUNCTION public.submit_assessment_attempt(
    p_attempt_id UUID,
    p_answers JSONB,
    p_time_spent INT DEFAULT 0,
    p_tab_switches INT DEFAULT 0
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_attempt RECORD;
    v_question RECORD;
    v_score INT := 0;
    v_max_score INT := 0;
    v_percentage DECIMAL(5,2);
    v_result RECORD;
    v_answer_key TEXT;
    v_user_answer JSONB;
BEGIN
    -- Get attempt
    SELECT * INTO v_attempt FROM public.assessment_attempts WHERE id = p_attempt_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Attempt not found';
    END IF;
    
    IF v_attempt.status != 'in_progress' THEN
        RAISE EXCEPTION 'Attempt already completed';
    END IF;
    
    -- Calculate score
    FOR v_question IN 
        SELECT q.* FROM public.assessment_questions q
        WHERE q.id = ANY(SELECT jsonb_array_elements_text(v_attempt.questions_order)::UUID)
    LOOP
        v_max_score := v_max_score + v_question.points;
        v_answer_key := v_question.id::TEXT;
        
        IF p_answers ? v_answer_key THEN
            v_user_answer := p_answers -> v_answer_key;
            -- Compare answers (supports both single and multiple choice)
            IF v_user_answer = v_question.correct_answer THEN
                v_score := v_score + v_question.points;
            END IF;
        END IF;
    END LOOP;
    
    -- Calculate percentage
    IF v_max_score > 0 THEN
        v_percentage := ROUND((v_score::DECIMAL / v_max_score) * 100, 2);
    ELSE
        v_percentage := 0;
    END IF;
    
    -- Get result level
    SELECT * INTO v_result 
    FROM public.assessment_results_mapping
    WHERE test_id = v_attempt.test_id
      AND v_percentage >= min_percentage
      AND v_percentage <= max_percentage
    LIMIT 1;
    
    -- Update attempt
    UPDATE public.assessment_attempts
    SET 
        answers = p_answers,
        score = v_score,
        max_score = v_max_score,
        percentage = v_percentage,
        result_level = COALESCE(v_result.level_code, 'A1'),
        result_level_name = COALESCE(v_result.level_name, 'Sơ cấp'),
        time_spent_seconds = p_time_spent,
        tab_switches = p_tab_switches,
        status = 'completed',
        completed_at = NOW()
    WHERE id = p_attempt_id;
    
    RETURN jsonb_build_object(
        'attempt_id', p_attempt_id,
        'score', v_score,
        'max_score', v_max_score,
        'percentage', v_percentage,
        'level_code', COALESCE(v_result.level_code, 'A1'),
        'level_name', COALESCE(v_result.level_name, 'Sơ cấp'),
        'description', v_result.description,
        'recommended_courses', COALESCE(v_result.recommended_courses, '[]'::JSONB)
    );
END;
$$;

-- ============================================
-- 8. SEED DATA - Sample Tests
-- ============================================

-- Insert sample tests
INSERT INTO public.assessment_tests (title, slug, category, description, short_description, icon_name, duration_minutes, total_questions, is_featured) VALUES
('Kiểm tra trình độ IELTS', 'ielts-placement', 'ielts', 
 'Bài test đánh giá năng lực tiếng Anh theo chuẩn IELTS. Kết quả sẽ giúp bạn biết trình độ hiện tại và lộ trình học phù hợp.',
 'Đánh giá trình độ theo chuẩn IELTS', 'Globe', 30, 30, true),

('Kiểm tra trình độ TOEIC', 'toeic-placement', 'toeic',
 'Bài test đánh giá năng lực tiếng Anh giao tiếp theo chuẩn TOEIC. Phù hợp cho người đi làm và sinh viên.',
 'Đánh giá trình độ theo chuẩn TOEIC', 'Briefcase', 25, 25, true),

('Kiểm tra trình độ Tin học', 'office-placement', 'office',
 'Bài test đánh giá kỹ năng tin học văn phòng cơ bản: Word, Excel, PowerPoint.',
 'Đánh giá kỹ năng tin học văn phòng', 'Monitor', 20, 20, false);

-- Insert CEFR-based results mapping for IELTS
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color) 
SELECT id, 0, 20, 'A1', 'Sơ cấp (Beginner)', 'Bạn đang ở mức bắt đầu. Khóa học Foundation sẽ giúp bạn xây dựng nền tảng vững chắc.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 21, 40, 'A2', 'Tiền trung cấp', 'Bạn có kiến thức cơ bản. Khóa học Pre-Intermediate sẽ giúp bạn nâng cao kỹ năng.', '#10b981'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 41, 60, 'B1', 'Trung cấp (Intermediate)', 'Trình độ khá tốt! Bạn sẵn sàng cho khóa IELTS 5.0-6.0.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 61, 80, 'B2', 'Trung cấp cao', 'Xuất sắc! Bạn có thể tham gia khóa IELTS 6.0-7.0.', '#8b5cf6'
FROM public.assessment_tests WHERE slug = 'ielts-placement'
UNION ALL
SELECT id, 81, 100, 'C1', 'Nâng cao (Advanced)', 'Tuyệt vời! Bạn sẵn sàng cho mục tiêu IELTS 7.0+.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'ielts-placement';

-- Insert results mapping for TOEIC
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color)
SELECT id, 0, 20, 'A1', 'Dưới 300 điểm', 'Bạn cần học từ nền tảng. Khóa TOEIC Starter phù hợp với bạn.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 21, 40, 'A2', '300-450 điểm', 'Bạn có kiến thức cơ bản. Khóa TOEIC 450+ sẽ giúp bạn.', '#10b981'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 41, 60, 'B1', '450-600 điểm', 'Khá tốt! Bạn sẵn sàng cho khóa TOEIC 600+.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 61, 80, 'B2', '600-750 điểm', 'Xuất sắc! Hãy thử sức với khóa TOEIC 750+.', '#8b5cf6'
FROM public.assessment_tests WHERE slug = 'toeic-placement'
UNION ALL
SELECT id, 81, 100, 'C1', 'Trên 750 điểm', 'Tuyệt vời! Bạn có thể nhắm đến TOEIC 900+.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'toeic-placement';

-- Insert results mapping for Office
INSERT INTO public.assessment_results_mapping (test_id, min_percentage, max_percentage, level_code, level_name, description, display_color)
SELECT id, 0, 40, 'Basic', 'Cơ bản', 'Bạn cần học thêm các kỹ năng cơ bản. Khóa Tin học Văn phòng Cơ bản phù hợp.', '#6b7280'
FROM public.assessment_tests WHERE slug = 'office-placement'
UNION ALL
SELECT id, 41, 70, 'Intermediate', 'Trung bình', 'Bạn đã có nền tảng tốt. Khóa Excel Nâng cao sẽ giúp bạn thăng tiến.', '#3b82f6'
FROM public.assessment_tests WHERE slug = 'office-placement'
UNION ALL
SELECT id, 71, 100, 'Advanced', 'Thành thạo', 'Tuyệt vời! Bạn có thể tham gia khóa IC3 hoặc MOS.', '#f59e0b'
FROM public.assessment_tests WHERE slug = 'office-placement';

-- ============================================
-- 9. SAMPLE QUESTIONS (IELTS - Grammar/Vocabulary)
-- ============================================

-- Get IELTS test ID
DO $$
DECLARE
    v_ielts_id UUID;
BEGIN
    SELECT id INTO v_ielts_id FROM public.assessment_tests WHERE slug = 'ielts-placement';
    
    -- Easy questions (difficulty 1-2)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'She _____ to school every day.', '["goes", "go", "going", "went"]', '["goes"]', 1, 'grammar', 1),
    (v_ielts_id, 'What is the opposite of "hot"?', '["warm", "cold", "cool", "ice"]', '["cold"]', 1, 'vocabulary', 2),
    (v_ielts_id, 'I _____ a student.', '["am", "is", "are", "be"]', '["am"]', 1, 'grammar', 3),
    (v_ielts_id, 'Choose the correct plural: One child, two _____', '["childs", "children", "childes", "child"]', '["children"]', 1, 'grammar', 4),
    (v_ielts_id, 'The book is _____ the table.', '["in", "on", "at", "to"]', '["on"]', 1, 'grammar', 5),
    (v_ielts_id, 'What color is the sky on a clear day?', '["green", "blue", "red", "yellow"]', '["blue"]', 1, 'vocabulary', 6);
    
    -- Medium questions (difficulty 3)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'If I _____ rich, I would travel the world.', '["am", "was", "were", "be"]', '["were"]', 3, 'grammar', 7),
    (v_ielts_id, 'The meeting has been _____ to next Monday.', '["postponed", "delayed", "cancelled", "arranged"]', '["postponed"]', 3, 'vocabulary', 8),
    (v_ielts_id, 'She asked me where I _____.', '["live", "lived", "living", "lives"]', '["lived"]', 3, 'grammar', 9),
    (v_ielts_id, 'Despite _____ hard, he failed the exam.', '["study", "studied", "studying", "studies"]', '["studying"]', 3, 'grammar', 10),
    (v_ielts_id, 'The word "ubiquitous" means:', '["rare", "everywhere", "unique", "beautiful"]', '["everywhere"]', 3, 'vocabulary', 11),
    (v_ielts_id, 'By the time we arrived, the movie _____.', '["started", "has started", "had started", "was starting"]', '["had started"]', 3, 'grammar', 12);
    
    -- Hard questions (difficulty 4-5)
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'The data _____ collected over a period of five years.', '["was", "were", "has been", "have been"]', '["were"]', 4, 'grammar', 13),
    (v_ielts_id, 'Not until the 1960s _____ to enter the workforce in large numbers.', '["women began", "did women begin", "women begin", "began women"]', '["did women begin"]', 5, 'grammar', 14),
    (v_ielts_id, 'The word "ephemeral" is closest in meaning to:', '["permanent", "temporary", "beautiful", "ancient"]', '["temporary"]', 4, 'vocabulary', 15),
    (v_ielts_id, 'Had I known about the traffic, I _____ earlier.', '["would leave", "would have left", "will leave", "left"]', '["would have left"]', 4, 'grammar', 16),
    (v_ielts_id, 'The phenomenon can be attributed to a _____ of factors.', '["myriad", "plenty", "lot", "much"]', '["myriad"]', 5, 'vocabulary', 17),
    (v_ielts_id, 'Seldom _____ such a brilliant performance.', '["I have seen", "have I seen", "I saw", "did I saw"]', '["have I seen"]', 5, 'grammar', 18);
    
    -- More medium questions to reach 30
    INSERT INTO public.assessment_questions (test_id, question_text, options, correct_answer, difficulty, skill_area, order_index) VALUES
    (v_ielts_id, 'The company is looking _____ new employees.', '["at", "for", "after", "into"]', '["for"]', 2, 'grammar', 19),
    (v_ielts_id, 'I wish I _____ speak French fluently.', '["can", "could", "would", "should"]', '["could"]', 2, 'grammar', 20),
    (v_ielts_id, 'The synonym of "significant" is:', '["small", "important", "simple", "difficult"]', '["important"]', 2, 'vocabulary', 21),
    (v_ielts_id, 'She speaks English very _____.', '["good", "well", "nice", "fine"]', '["well"]', 2, 'grammar', 22),
    (v_ielts_id, 'We _____ here since 2010.', '["live", "lived", "have lived", "are living"]', '["have lived"]', 2, 'grammar', 23),
    (v_ielts_id, 'The antonym of "ancient" is:', '["old", "modern", "historic", "traditional"]', '["modern"]', 2, 'vocabulary', 24),
    (v_ielts_id, 'I am used to _____ early.', '["wake", "waking", "woke", "waken"]', '["waking"]', 3, 'grammar', 25),
    (v_ielts_id, 'The report must _____ by Friday.', '["complete", "completed", "be completed", "completing"]', '["be completed"]', 3, 'grammar', 26),
    (v_ielts_id, 'Neither Tom nor his friends _____ coming to the party.', '["is", "are", "was", "were"]', '["are"]', 3, 'grammar', 27),
    (v_ielts_id, 'The word "meticulous" means:', '["careless", "careful", "quick", "slow"]', '["careful"]', 3, 'vocabulary', 28),
    (v_ielts_id, 'It is high time we _____ action.', '["take", "took", "taken", "taking"]', '["took"]', 4, 'grammar', 29),
    (v_ielts_id, 'Hardly _____ the station when the train left.', '["I reached", "had I reached", "I had reached", "did I reach"]', '["had I reached"]', 4, 'grammar', 30);
END $$;

-- ============================================
-- 10. GRANT PERMISSIONS FOR RPC FUNCTIONS
-- ============================================
GRANT EXECUTE ON FUNCTION public.start_assessment_attempt TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.submit_assessment_attempt TO anon, authenticated;
