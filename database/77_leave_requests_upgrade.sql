-- ============================================================
-- LEAVE REQUESTS — RLS UPGRADE
-- Version: 77
-- Description: Thêm RLS policies còn thiếu cho leave_requests:
--   1. UPDATE policy cho giáo viên (edit đơn pending của mình)
--   2. DELETE policy cho giáo viên (thu hồi đơn pending của mình)
--
-- NOTE: Production DB đã có đầy đủ schema:
--   - staff_id (không phải teacher_id)
--   - reviewer_notes
--   - attachments JSONB DEFAULT '[]'
--   - total_days INTEGER
--   - leave_type hỗ trợ: annual, sick, personal, maternity, compensatory, other
--   - status hỗ trợ: pending, approved, rejected, cancelled
-- ============================================================

-- Thêm RLS UPDATE: Giáo viên có thể sửa đơn pending của chính mình
CREATE POLICY "Users can update own pending leave requests"
ON public.leave_requests
FOR UPDATE
USING (staff_id = auth.uid() AND status = 'pending')
WITH CHECK (staff_id = auth.uid() AND status = 'pending');

-- Thêm RLS DELETE: Giáo viên có thể xóa đơn pending của chính mình
CREATE POLICY "Users can delete own pending leave requests"
ON public.leave_requests
FOR DELETE
USING (staff_id = auth.uid() AND status = 'pending');
