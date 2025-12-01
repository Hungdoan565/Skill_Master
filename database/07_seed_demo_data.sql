-- ============================================================
-- SEED DEMO DATA - Dữ liệu giả để Demo/Bảo vệ đồ án
-- Version: 2.0
-- Mục đích: Cập nhật paid_amount trong enrollments để Dashboard có biểu đồ đẹp
-- ============================================================

-- ⚠️ LƯU Ý: Chạy file này SAU KHI đã có ít nhất 1-2 students và 2-3 classes trong DB

-- ============================================================
-- 1. CẬP NHẬT ENROLLMENTS - Thêm paid_amount để tạo doanh thu
-- ============================================================
-- Doanh thu lịch sử từ các enrollments đã tồn tại
-- Cách làm: Cập nhật paid_amount của các enrollment hiện có với số tiền khác nhau

-- ============================================================
-- 2. CẬP NHẬT ENROLLMENTS - Thêm paid_amount để tạo doanh thu
-- ============================================================
-- Chiến lược: Lấy các enrollment đã tồn tại và cập nhật paid_amount
-- để Dashboard tính doanh thu từ SUM(paid_amount)

DO $$
DECLARE
  v_enrollment_id UUID;
  v_counter INT := 0;
  v_rand_amount NUMERIC;
BEGIN
  -- Cập nhật các enrollment hiện có với paid_amount khác nhau
  FOR v_enrollment_id IN 
    SELECT id FROM public.enrollments 
    WHERE paid_amount IS NULL OR paid_amount = 0
    LIMIT 30
  LOOP
    v_counter := v_counter + 1;
    
    -- Tạo số tiền ngẫu nhiên giữa 2M-5M cho mỗi enrollment
    v_rand_amount := FLOOR(RANDOM() * 3000000)::NUMERIC + 2000000;
    
    UPDATE public.enrollments 
    SET paid_amount = v_rand_amount
    WHERE id = v_enrollment_id;
    
    RAISE NOTICE 'Cập nhật enrollment #% với paid_amount = %', v_counter, v_rand_amount;
  END LOOP;

  RAISE NOTICE '✅ Đã cập nhật % enrollments với paid_amount mới', v_counter;
END $$;

-- ============================================================
-- 3. KIỂM TRA KẾT QUẢ - Doanh thu hiện tại
-- ============================================================
SELECT 
  COUNT(*) AS total_enrollments,
  SUM(paid_amount) AS total_revenue,
  ROUND(AVG(paid_amount), 0) AS avg_payment,
  MIN(paid_amount) AS min_payment,
  MAX(paid_amount) AS max_payment
FROM public.enrollments
WHERE paid_amount > 0;

-- ============================================================
-- 4. KIỂM TRA CHI TIẾT ENROLLMENTS ĐÃ CẬP NHẬT
-- ============================================================
SELECT 
  e.id,
  u.full_name AS student_name,
  c.name AS class_name,
  e.tuition_fee,
  e.paid_amount,
  e.status,
  e.created_at
FROM public.enrollments e
JOIN public.users u ON e.student_id = u.id
JOIN public.classes c ON e.class_id = c.id
WHERE e.paid_amount > 0
ORDER BY e.created_at DESC
LIMIT 15;
