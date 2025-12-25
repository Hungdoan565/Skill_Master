-- ============================================================
-- MIGRATION: Seed Remaining Courses Data
-- Version: 32
-- Date: 2025-12-24
-- Description: Populate features, syllabus, outcomes for TOEIC, Programming, Communication
-- ============================================================

-- 1. Update TOEIC Courses
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Foundation & Vocabulary", "topics": ["Assessment Test", "Essential Business Vocabulary", "Grammar Refresh"]},
    {"week": 2, "title": "Listening Part 1 & 2", "topics": ["Photographs", "Question-Response", "Distractor Traps"]},
    {"week": 3, "title": "Listening Part 3 & 4", "topics": ["Conversations", "Talks", "Keyword Spotting"]},
    {"week": 4, "title": "Reading Part 5 & 6", "topics": ["Incomplete Sentences", "Text Completion", "Time Management"]},
    {"week": 5, "title": "Reading Part 7 & Review", "topics": ["Reading Comprehension", "Double/Triple Passages", "Speed Reading"]}
  ]'::jsonb,
  features = '["Giáo trình ETS 2024 mới nhất", "Cam kết tăng 150-200 điểm", "Thi thử trên máy tính như thật", "Hỗ trợ lệ phí thi tại IIG", "Lớp học tối đa 15 học viên"]'::jsonb,
  outcomes = '["Nắm vững cấu trúc bài thi TOEIC 2 kỹ năng", "Thành thạo 3000+ từ vựng Business English", "Kỹ năng nghe hiểu giọng Anh-Mỹ-Úc-Canada", "Đạt chuẩn đầu ra tốt nghiệp hoặc đi làm"]'::jsonb,
  faq = '[
    {"question": "Khóa học kéo dài bao lâu?", "answer": "Khóa học thường kéo dài 2-3 tháng tùy theo trình độ đầu vào."},
    {"question": "Học phí đã bao gồm giáo trình chưa?", "answer": "Học phí đã bao gồm toàn bộ giáo trình và tài liệu bổ trợ."},
    {"question": "Nếu thi không đạt thì sao?", "answer": "Học viên được học lại miễn phí nếu đi học đầy đủ và làm bài tập đúng quy định."}
  ]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (title ILIKE '%TOEIC%' OR code ILIKE '%TOEIC%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 2. Update Programming/IT Courses (Web, Java, Python)
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Programming Basics", "topics": ["Variables & Data Types", "Control Structures", "Functions", "Basic Algorithms"]},
    {"week": 2, "title": "Object-Oriented Programming", "topics": ["Classes & Objects", "Inheritance", "Polymorphism", "Encapsulation"]},
    {"week": 3, "title": "Data Structures", "topics": ["Arrays & Lists", "Dictionaries/Maps", "Stacks & Queues", "Trees Basics"]},
    {"week": 4, "title": "Database Integration", "topics": ["SQL Basics", "CRUD Operations", "ORM Frameworks", "Database Design"]},
    {"week": 5, "title": "Project Development", "topics": ["Requirements Analysis", "System Design", "Coding Standards", "Version Control (Git)"]},
    {"week": 6, "title": "Final Project & Deployment", "topics": ["Testing & Debugging", "Deployment Strategies", "Project Presentation", "Code Review"]}
  ]'::jsonb,
  features = '["Dự án thực tế 100%", "Giảng viên Senior Developer", "Cam kết giới thiệu việc làm", "Code review 1:1 hàng tuần", "Chứng chỉ hoàn thành khóa học"]'::jsonb,
  outcomes = '["Tư duy lập trình vững chắc", "Xây dựng được ứng dụng hoàn chỉnh", "Kỹ năng làm việc nhóm (Agile/Scrum)", "Sẵn sàng cho vị trí Fresher/Junior"]'::jsonb,
  faq = '[
    {"question": "Tôi chưa biết gì về code có học được không?", "answer": "Được. Khóa học thiết kế cho người mới bắt đầu từ con số 0."},
    {"question": "Cần máy tính cấu hình cao không?", "answer": "Chỉ cần laptop i5, RAM 8GB là đủ để học lập trình cơ bản."},
    {"question": "Học xong có xin được việc không?", "answer": "Trung tâm cam kết hỗ trợ CV và kết nối với mạng lưới doanh nghiệp đối tác."}
  ]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'programming' OR title ILIKE '%Java%' OR title ILIKE '%Python%' OR title ILIKE '%Web%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 3. Update English Communication Courses
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "Introduction & Greetings", "topics": ["Self-introduction", "Small talk", "Cultural etiquette"]},
    {"week": 2, "title": "Daily Routines", "topics": ["Time & Schedules", "Hobbies & Interests", "Describe Habit"]},
    {"week": 3, "title": "Travel & Directions", "topics": ["Asking directions", "Booking hotels", "At the airport"]},
    {"week": 4, "title": "Shopping & Dining", "topics": ["Ordering food", "Bargaining", "Complaints"]},
    {"week": 5, "title": "Workplace Communication", "topics": ["Phone etiquette", "Writing emails", "Participating in meetings"]}
  ]'::jsonb,
  features = '["100% Giáo viên nước ngoài/IELTS 8.0", "Lớp học ít người (6-10 HV)", "Phương pháp phản xạ Callan", "Câu lạc bộ tiếng Anh hàng tuần", "Giờ học linh hoạt"]'::jsonb,
  outcomes = '["Tự tin giao tiếp với người nước ngoài", "Phát âm chuẩn IPA", "Vốn từ vựng thông dụng phong phú", "Phản xạ nghe lại tự nhiên"]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'communication' OR title ILIKE '%Communication%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 4. Catch-all for any remaining IELTS courses (like IELTS-01 with category 'IELTS')
UPDATE public.courses
SET 
  syllabus = '[
    {"week": 1, "title": "IELTS Overview", "topics": ["Exam Structure", "Scoring Criteria", "Study Plan"]},
    {"week": 2, "title": "Listening & Reading Basics", "topics": ["Question Types", "Keyword Strategy", "Speed Reading"]},
    {"week": 3, "title": "Speaking Confidence", "topics": ["Part 1 Familiar Topics", "Fluency & Coherence", "Pronunciation"]},
    {"week": 4, "title": "Writing Task 1", "topics": ["Chart Analysis", "Describing Trends", "Comparing Data"]},
    {"week": 5, "title": "Writing Task 2", "topics": ["Essay Structure", "Idea Generation", "Cohesion & Coherence"]}
  ]'::jsonb,
  features = '["Giáo viên IELTS 8.0+", "Cam kết đầu ra bằng văn bản", "Chấm bài Writing chi tiết", "Thi thử Mock Test hàng tháng", "Tài liệu độc quyền"]'::jsonb,
  outcomes = '["Nắm vững chiến thuật làm bài", "Cải thiện toàn diện 4 kỹ năng", "Tự tin bước vào kỳ thi thật", "Đạt band điểm mục tiêu"]'::jsonb,
  slug = LOWER(REPLACE(REPLACE(code, '_', '-'), ' ', '-'))
WHERE (category = 'IELTS' OR title ILIKE '%IELTS%') AND (features IS NULL OR jsonb_array_length(features) = 0);

-- 5. Fix any duplicate slugs if generated
-- This is a simple safety check, in production we might need smarter deduping
-- For now, we assume unique codes produce unique slugs
