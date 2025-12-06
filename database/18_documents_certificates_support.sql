-- ============================================================
-- SKILL MASTER DATABASE - DOCUMENTS, CERTIFICATES & SUPPORT
-- Version: 1.0
-- Description: Tài liệu học tập, Chứng chỉ, và Hệ thống hỗ trợ
-- ============================================================

-- ============================================================
-- 1. BẢNG DOCUMENTS - Tài liệu học tập
-- ============================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  title TEXT NOT NULL,
  description TEXT,
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER, -- bytes
  file_type TEXT, -- pdf, doc, mp4, etc.
  
  -- Liên kết với khóa học/lớp học (optional)
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  center_id UUID REFERENCES public.centers(id),
  
  -- Document type
  type TEXT NOT NULL DEFAULT 'material' CHECK (type IN ('material', 'assignment', 'resource', 'other')),
  
  -- Access control
  is_public BOOLEAN DEFAULT false, -- true = tất cả học viên xem được
  
  -- Metadata
  uploaded_by UUID REFERENCES public.users(id),
  download_count INTEGER DEFAULT 0,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 2. BẢNG CERTIFICATE_TEMPLATES - Mẫu chứng chỉ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  name TEXT NOT NULL,
  description TEXT,
  
  -- Template settings
  template_html TEXT, -- HTML template for certificate
  background_image TEXT, -- Background image URL
  
  -- Linked course (optional - template có thể dùng chung)
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  center_id UUID REFERENCES public.centers(id),
  
  is_active BOOLEAN DEFAULT true,
  
  created_by UUID REFERENCES public.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. BẢNG CERTIFICATES - Chứng chỉ được cấp
-- ============================================================
CREATE TABLE IF NOT EXISTS public.certificates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Certificate info
  certificate_number TEXT UNIQUE NOT NULL, -- Số chứng chỉ: CC-2024-001
  
  -- Recipient
  student_id UUID NOT NULL REFERENCES public.users(id),
  student_name TEXT NOT NULL, -- Lưu tên tại thời điểm cấp
  
  -- Related course/class
  course_id UUID REFERENCES public.courses(id),
  class_id UUID REFERENCES public.classes(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  
  -- Certificate details
  course_name TEXT NOT NULL, -- Lưu tên khóa học tại thời điểm cấp
  completion_date DATE NOT NULL,
  grade TEXT, -- Excellent, Good, Pass, etc.
  
  -- Template used
  template_id UUID REFERENCES public.certificate_templates(id),
  center_id UUID REFERENCES public.centers(id),
  
  -- Generated PDF
  pdf_url TEXT,
  
  -- Status
  status TEXT NOT NULL DEFAULT 'issued' CHECK (status IN ('issued', 'revoked', 'expired')),
  revoked_at TIMESTAMPTZ,
  revoked_reason TEXT,
  
  -- Metadata
  issued_by UUID REFERENCES public.users(id),
  issued_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. BẢNG SUPPORT_TICKETS - Yêu cầu hỗ trợ
-- ============================================================
CREATE TABLE IF NOT EXISTS public.support_tickets (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Ticket info
  ticket_number TEXT UNIQUE NOT NULL, -- TK-2024-0001
  subject TEXT NOT NULL,
  
  -- Category & Priority
  category TEXT NOT NULL DEFAULT 'general' CHECK (category IN ('general', 'technical', 'billing', 'course', 'other')),
  priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  
  -- Status
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'in_progress', 'waiting', 'resolved', 'closed')),
  
  -- Participants
  created_by UUID NOT NULL REFERENCES public.users(id),
  assigned_to UUID REFERENCES public.users(id),
  center_id UUID REFERENCES public.centers(id),
  
  -- Related entities (optional)
  class_id UUID REFERENCES public.classes(id),
  enrollment_id UUID REFERENCES public.enrollments(id),
  
  -- Resolution
  resolved_at TIMESTAMPTZ,
  resolved_by UUID REFERENCES public.users(id),
  resolution_notes TEXT,
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. BẢNG TICKET_MESSAGES - Tin nhắn trong ticket
-- ============================================================
CREATE TABLE IF NOT EXISTS public.ticket_messages (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  ticket_id UUID NOT NULL REFERENCES public.support_tickets(id) ON DELETE CASCADE,
  
  -- Message content
  message TEXT NOT NULL,
  
  -- Attachment (optional)
  attachment_url TEXT,
  attachment_name TEXT,
  
  -- Sender
  sender_id UUID NOT NULL REFERENCES public.users(id),
  is_internal BOOLEAN DEFAULT false, -- true = internal note (student không thấy)
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 6. INDEXES - Tối ưu query
-- ============================================================
-- Documents indexes
CREATE INDEX IF NOT EXISTS idx_documents_course_id ON public.documents(course_id);
CREATE INDEX IF NOT EXISTS idx_documents_class_id ON public.documents(class_id);
CREATE INDEX IF NOT EXISTS idx_documents_center_id ON public.documents(center_id);
CREATE INDEX IF NOT EXISTS idx_documents_type ON public.documents(type);
CREATE INDEX IF NOT EXISTS idx_documents_uploaded_by ON public.documents(uploaded_by);

-- Certificates indexes
CREATE INDEX IF NOT EXISTS idx_certificates_student_id ON public.certificates(student_id);
CREATE INDEX IF NOT EXISTS idx_certificates_course_id ON public.certificates(course_id);
CREATE INDEX IF NOT EXISTS idx_certificates_class_id ON public.certificates(class_id);
CREATE INDEX IF NOT EXISTS idx_certificates_center_id ON public.certificates(center_id);
CREATE INDEX IF NOT EXISTS idx_certificates_status ON public.certificates(status);
CREATE INDEX IF NOT EXISTS idx_certificates_number ON public.certificates(certificate_number);

-- Support tickets indexes
CREATE INDEX IF NOT EXISTS idx_support_tickets_created_by ON public.support_tickets(created_by);
CREATE INDEX IF NOT EXISTS idx_support_tickets_assigned_to ON public.support_tickets(assigned_to);
CREATE INDEX IF NOT EXISTS idx_support_tickets_center_id ON public.support_tickets(center_id);
CREATE INDEX IF NOT EXISTS idx_support_tickets_status ON public.support_tickets(status);
CREATE INDEX IF NOT EXISTS idx_support_tickets_priority ON public.support_tickets(priority);
CREATE INDEX IF NOT EXISTS idx_support_tickets_category ON public.support_tickets(category);

-- Ticket messages indexes
CREATE INDEX IF NOT EXISTS idx_ticket_messages_ticket_id ON public.ticket_messages(ticket_id);
CREATE INDEX IF NOT EXISTS idx_ticket_messages_sender_id ON public.ticket_messages(sender_id);

-- ============================================================
-- 7. RLS POLICIES - Row Level Security
-- ============================================================
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ticket_messages ENABLE ROW LEVEL SECURITY;

-- Documents Policies
CREATE POLICY "documents_select_policy" ON public.documents
  FOR SELECT USING (
    -- Admin và Manager xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
    OR
    -- Teacher xem tài liệu của mình hoặc public
    (uploaded_by = auth.uid())
    OR
    -- Student xem tài liệu public hoặc của lớp mình đang học
    (is_public = true)
    OR
    EXISTS (
      SELECT 1 FROM public.enrollments e
      WHERE e.student_id = auth.uid()
      AND e.class_id = documents.class_id
      AND e.status = 'active'
    )
  );

CREATE POLICY "documents_insert_policy" ON public.documents
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );

CREATE POLICY "documents_update_policy" ON public.documents
  FOR UPDATE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

CREATE POLICY "documents_delete_policy" ON public.documents
  FOR DELETE USING (
    uploaded_by = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Certificate Templates Policies
CREATE POLICY "cert_templates_select_policy" ON public.certificate_templates
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
  );

CREATE POLICY "cert_templates_manage_policy" ON public.certificate_templates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Certificates Policies
CREATE POLICY "certificates_select_policy" ON public.certificates
  FOR SELECT USING (
    -- Admin/Manager xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
    OR
    -- Student xem chứng chỉ của mình
    student_id = auth.uid()
  );

CREATE POLICY "certificates_manage_policy" ON public.certificates
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Support Tickets Policies
CREATE POLICY "support_tickets_select_policy" ON public.support_tickets
  FOR SELECT USING (
    -- Admin/Manager/Staff xem tất cả
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
    )
    OR
    -- User xem ticket của mình
    created_by = auth.uid()
  );

CREATE POLICY "support_tickets_insert_policy" ON public.support_tickets
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "support_tickets_update_policy" ON public.support_tickets
  FOR UPDATE USING (
    created_by = auth.uid()
    OR
    assigned_to = auth.uid()
    OR
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Ticket Messages Policies
CREATE POLICY "ticket_messages_select_policy" ON public.ticket_messages
  FOR SELECT USING (
    -- Kiểm tra quyền xem ticket
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
    -- Nếu là internal note, chỉ staff mới xem được
    AND (
      is_internal = false
      OR
      EXISTS (
        SELECT 1 FROM public.users u
        JOIN public.roles r ON u.role_id = r.id
        WHERE u.id = auth.uid()
        AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
      )
    )
  );

CREATE POLICY "ticket_messages_insert_policy" ON public.ticket_messages
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.support_tickets t
      WHERE t.id = ticket_messages.ticket_id
      AND (
        t.created_by = auth.uid()
        OR t.assigned_to = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.users u
          JOIN public.roles r ON u.role_id = r.id
          WHERE u.id = auth.uid()
          AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER', 'TEACHER')
        )
      )
    )
  );

-- ============================================================
-- 8. FUNCTIONS - Utility functions
-- ============================================================

-- Function to generate certificate number
CREATE OR REPLACE FUNCTION generate_certificate_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(certificate_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.certificates
  WHERE certificate_number LIKE 'CC-' || year_str || '-%';
  
  RETURN 'CC-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Function to generate ticket number
CREATE OR REPLACE FUNCTION generate_ticket_number()
RETURNS TEXT AS $$
DECLARE
  next_num INTEGER;
  year_str TEXT;
BEGIN
  year_str := TO_CHAR(NOW(), 'YYYY');
  SELECT COALESCE(MAX(CAST(SUBSTRING(ticket_number FROM 9) AS INTEGER)), 0) + 1
  INTO next_num
  FROM public.support_tickets
  WHERE ticket_number LIKE 'TK-' || year_str || '-%';
  
  RETURN 'TK-' || year_str || '-' || LPAD(next_num::TEXT, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- ============================================================
-- 9. SEED DATA - Dữ liệu mẫu
-- ============================================================

-- Insert default certificate template
INSERT INTO public.certificate_templates (name, description, template_html, is_active)
SELECT 
  'Chứng chỉ hoàn thành khóa học',
  'Mẫu chứng chỉ mặc định cho tất cả khóa học',
  '<div class="certificate">
    <h1>CHỨNG CHỈ HOÀN THÀNH</h1>
    <p>Chứng nhận rằng</p>
    <h2>{{student_name}}</h2>
    <p>Đã hoàn thành xuất sắc khóa học</p>
    <h3>{{course_name}}</h3>
    <p>Ngày hoàn thành: {{completion_date}}</p>
    <p>Số chứng chỉ: {{certificate_number}}</p>
  </div>',
  true
WHERE NOT EXISTS (SELECT 1 FROM public.certificate_templates LIMIT 1);

-- ============================================================
-- DONE! Migration completed successfully
-- ============================================================
