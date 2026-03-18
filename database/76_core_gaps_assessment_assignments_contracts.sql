-- =====================================================
-- MIGRATION 76: Core Gaps - Assignments & Labor Contracts
-- =====================================================

BEGIN;

-- -----------------------------------------------------
-- 1) Structured assignments
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.assignments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  class_id UUID REFERENCES public.classes(id) ON DELETE SET NULL,
  course_id UUID REFERENCES public.courses(id) ON DELETE SET NULL,
  legacy_session_id UUID UNIQUE REFERENCES public.sessions(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  instructions TEXT,
  due_at TIMESTAMPTZ,
  max_score NUMERIC(8,2) NOT NULL DEFAULT 100,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'closed', 'archived')),
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignments_center_id ON public.assignments(center_id);
CREATE INDEX IF NOT EXISTS idx_assignments_class_id ON public.assignments(class_id);
CREATE INDEX IF NOT EXISTS idx_assignments_status_due_at ON public.assignments(status, due_at);

CREATE TABLE IF NOT EXISTS public.assignment_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id UUID NOT NULL REFERENCES public.assignments(id) ON DELETE CASCADE,
  student_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'submitted', 'resubmitted', 'graded')),
  content JSONB NOT NULL DEFAULT '{}'::jsonb,
  submitted_at TIMESTAMPTZ,
  grade NUMERIC(8,2),
  graded_at TIMESTAMPTZ,
  grader_user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (assignment_id, student_user_id)
);

CREATE INDEX IF NOT EXISTS idx_assignment_submissions_assignment_id ON public.assignment_submissions(assignment_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_student_user_id ON public.assignment_submissions(student_user_id);
CREATE INDEX IF NOT EXISTS idx_assignment_submissions_status ON public.assignment_submissions(status);

CREATE TABLE IF NOT EXISTS public.assignment_feedback (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES public.assignment_submissions(id) ON DELETE CASCADE,
  feedback_text TEXT NOT NULL,
  attachments JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_assignment_feedback_submission_id ON public.assignment_feedback(submission_id);

-- -----------------------------------------------------
-- 2) Labor contracts
-- -----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.hr_contracts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  staff_user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  contract_code TEXT NOT NULL,
  contract_type TEXT NOT NULL DEFAULT 'full_time',
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'amended', 'expired', 'terminated')),
  effective_from DATE NOT NULL,
  effective_to DATE,
  base_salary NUMERIC(12,2) NOT NULL DEFAULT 0,
  allowances JSONB NOT NULL DEFAULT '{}'::jsonb,
  terms JSONB NOT NULL DEFAULT '{}'::jsonb,
  notes TEXT,
  current_version INT NOT NULL DEFAULT 1,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (center_id, contract_code)
);

CREATE INDEX IF NOT EXISTS idx_hr_contracts_center_id ON public.hr_contracts(center_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_staff_user_id ON public.hr_contracts(staff_user_id);
CREATE INDEX IF NOT EXISTS idx_hr_contracts_status ON public.hr_contracts(status);

CREATE TABLE IF NOT EXISTS public.hr_contract_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contract_id UUID NOT NULL REFERENCES public.hr_contracts(id) ON DELETE CASCADE,
  center_id UUID NOT NULL REFERENCES public.centers(id) ON DELETE CASCADE,
  event_type TEXT NOT NULL CHECK (event_type IN ('create', 'activate', 'amend', 'expire', 'terminate', 'restore')),
  from_status TEXT,
  to_status TEXT,
  event_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  reason TEXT,
  effective_date DATE,
  created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_hr_contract_events_contract_id ON public.hr_contract_events(contract_id);
CREATE INDEX IF NOT EXISTS idx_hr_contract_events_center_id ON public.hr_contract_events(center_id);
CREATE INDEX IF NOT EXISTS idx_hr_contract_events_created_at ON public.hr_contract_events(created_at DESC);

-- -----------------------------------------------------
-- 3) Row Level Security for new tables
-- -----------------------------------------------------
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assignment_feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hr_contract_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS assignments_center_isolation_select ON public.assignments;
CREATE POLICY assignments_center_isolation_select ON public.assignments
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  );

DROP POLICY IF EXISTS assignments_center_isolation_modify ON public.assignments;
CREATE POLICY assignments_center_isolation_modify ON public.assignments
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = assignments.center_id
    )
  );

DROP POLICY IF EXISTS assignment_submissions_center_isolation_select ON public.assignment_submissions;
CREATE POLICY assignment_submissions_center_isolation_select ON public.assignment_submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_submissions_center_isolation_modify ON public.assignment_submissions;
CREATE POLICY assignment_submissions_center_isolation_modify ON public.assignment_submissions
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignments a
      JOIN public.users u ON u.id = auth.uid()
      WHERE a.id = assignment_submissions.assignment_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_feedback_center_isolation_select ON public.assignment_feedback;
CREATE POLICY assignment_feedback_center_isolation_select ON public.assignment_feedback
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS assignment_feedback_center_isolation_modify ON public.assignment_feedback;
CREATE POLICY assignment_feedback_center_isolation_modify ON public.assignment_feedback
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.assignment_submissions s
      JOIN public.assignments a ON a.id = s.assignment_id
      JOIN public.users u ON u.id = auth.uid()
      WHERE s.id = assignment_feedback.submission_id
        AND u.center_id = a.center_id
    )
  );

DROP POLICY IF EXISTS hr_contracts_center_isolation_select ON public.hr_contracts;
CREATE POLICY hr_contracts_center_isolation_select ON public.hr_contracts
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  );

DROP POLICY IF EXISTS hr_contracts_center_isolation_modify ON public.hr_contracts;
CREATE POLICY hr_contracts_center_isolation_modify ON public.hr_contracts
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contracts.center_id
    )
  );

DROP POLICY IF EXISTS hr_contract_events_center_isolation_select ON public.hr_contract_events;
CREATE POLICY hr_contract_events_center_isolation_select ON public.hr_contract_events
  FOR SELECT USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  );

DROP POLICY IF EXISTS hr_contract_events_center_isolation_modify ON public.hr_contract_events;
CREATE POLICY hr_contract_events_center_isolation_modify ON public.hr_contract_events
  FOR ALL USING (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.users u
      WHERE u.id = auth.uid() AND u.center_id = hr_contract_events.center_id
    )
  );

-- -----------------------------------------------------
-- 4) Seed feature flags using existing system_settings
-- -----------------------------------------------------
INSERT INTO public.system_settings (center_id, key, value, description)
VALUES
  (NULL, 'feature_core_online_assessment_engine', '{"enabled": false}'::jsonb, 'Feature flag for online assessment engine rollout'),
  (NULL, 'feature_core_structured_assignments_management', '{"enabled": false}'::jsonb, 'Feature flag for structured assignments rollout'),
  (NULL, 'feature_core_labor_contract_management', '{"enabled": false}'::jsonb, 'Feature flag for labor contract rollout')
ON CONFLICT (key) WHERE center_id IS NULL
DO UPDATE SET
  value = EXCLUDED.value,
  description = EXCLUDED.description,
  updated_at = NOW();

COMMIT;
