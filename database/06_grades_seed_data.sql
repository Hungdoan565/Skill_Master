-- ============================================================
-- SEED DATA: Cấu trúc điểm mẫu cho các khóa học
-- Chạy SAU KHI đã có courses trong DB
-- ============================================================

-- 1. Tìm course_id và insert cấu trúc điểm IELTS
DO $$
DECLARE
  ielts_course_id UUID;
  webdev_course_id UUID;
BEGIN
  -- Tìm khóa IELTS (tìm theo tên gần đúng)
  SELECT id INTO ielts_course_id FROM public.courses 
  WHERE title ILIKE '%IELTS%' OR title ILIKE '%English%' OR title ILIKE '%Anh%'
  LIMIT 1;
  
  IF ielts_course_id IS NOT NULL THEN
    RAISE NOTICE 'Found IELTS course: %', ielts_course_id;
    
    -- Insert cấu trúc điểm cho khóa IELTS (4 kỹ năng)
    INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
    VALUES 
      (ielts_course_id, 'Listening', 0.25, 9.0, 1, 'Điểm nghe IELTS (0-9)'),
      (ielts_course_id, 'Reading', 0.25, 9.0, 2, 'Điểm đọc IELTS (0-9)'),
      (ielts_course_id, 'Writing', 0.25, 9.0, 3, 'Điểm viết IELTS (0-9)'),
      (ielts_course_id, 'Speaking', 0.25, 9.0, 4, 'Điểm nói IELTS (0-9)')
    ON CONFLICT (course_id, name) DO NOTHING;
    
    RAISE NOTICE 'Inserted IELTS grade structure (4 columns)';
  ELSE
    RAISE NOTICE 'IELTS course not found, skipping...';
  END IF;
  
  -- Tìm khóa Web Development
  SELECT id INTO webdev_course_id FROM public.courses 
  WHERE title ILIKE '%Web%' OR title ILIKE '%React%' OR title ILIKE '%JavaScript%' OR title ILIKE '%Lập trình%'
  LIMIT 1;
  
  IF webdev_course_id IS NOT NULL THEN
    RAISE NOTICE 'Found Web Dev course: %', webdev_course_id;
    
    -- Insert cấu trúc điểm cho khóa Web Dev
    INSERT INTO public.grade_structures (course_id, name, weight, max_score, order_index, description)
    VALUES 
      (webdev_course_id, 'Lab Exercises', 0.20, 10.0, 1, 'Điểm bài tập thực hành'),
      (webdev_course_id, 'Mid-term', 0.30, 10.0, 2, 'Điểm giữa kỳ'),
      (webdev_course_id, 'Final Project', 0.50, 10.0, 3, 'Điểm đồ án cuối khóa')
    ON CONFLICT (course_id, name) DO NOTHING;
    
    RAISE NOTICE 'Inserted Web Dev grade structure (3 columns)';
  ELSE
    RAISE NOTICE 'Web Dev course not found, skipping...';
  END IF;
  
END $$;

-- 2. Kiểm tra kết quả
SELECT 
  gs.id,
  c.title AS course_name,
  gs.name AS grade_column,
  gs.weight * 100 || '%' AS weight_percent,
  gs.max_score,
  gs.order_index
FROM public.grade_structures gs
JOIN public.courses c ON gs.course_id = c.id
ORDER BY c.title, gs.order_index;
