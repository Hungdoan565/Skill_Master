-- Migration: Create enrollment_requests table
-- Allows students to request enrollment in classes, with admin approval workflow

-- Create enrollment_requests table
CREATE TABLE IF NOT EXISTS enrollment_requests (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    class_id UUID NOT NULL REFERENCES classes(id) ON DELETE CASCADE,
    center_id UUID NOT NULL REFERENCES centers(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'waitlisted', 'enrolled', 'cancelled')),
    message TEXT,
    admin_note TEXT,
    reviewed_by UUID REFERENCES users(id),
    reviewed_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE(student_id, class_id)
);

-- Indexes for common query patterns
CREATE INDEX idx_enrollment_requests_center_status ON enrollment_requests(center_id, status);
CREATE INDEX idx_enrollment_requests_student_status ON enrollment_requests(student_id, status);
CREATE INDEX idx_enrollment_requests_class_id ON enrollment_requests(class_id);

-- Enable RLS
ALTER TABLE enrollment_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Students can view their own requests
CREATE POLICY "Students can view own enrollment requests"
    ON enrollment_requests FOR SELECT
    TO authenticated
    USING (student_id = auth.uid());

-- RLS Policy: Students can insert their own requests
CREATE POLICY "Students can create enrollment requests"
    ON enrollment_requests FOR INSERT
    TO authenticated
    WITH CHECK (student_id = auth.uid());

-- RLS Policy: Students can delete (cancel) their own pending/waitlisted requests
CREATE POLICY "Students can cancel own pending requests"
    ON enrollment_requests FOR DELETE
    TO authenticated
    USING (student_id = auth.uid() AND status IN ('pending', 'waitlisted'));

-- RLS Policy: Service role has full access (for backend API operations)
CREATE POLICY "Service role full access on enrollment requests"
    ON enrollment_requests FOR ALL
    TO service_role
    USING (true)
    WITH CHECK (true);

-- RLS Policy: Staff can view all requests at their center (via service_role, handled by backend)
-- Note: Backend uses service_role for all admin operations, scoped by center_id in queries

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_enrollment_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_enrollment_requests_updated_at
    BEFORE UPDATE ON enrollment_requests
    FOR EACH ROW
    EXECUTE FUNCTION update_enrollment_requests_updated_at();

-- Add to realtime publication for live updates
ALTER PUBLICATION supabase_realtime ADD TABLE enrollment_requests;
