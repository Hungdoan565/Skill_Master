BEGIN;

ALTER TABLE public.assessment_tests
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL;

ALTER TABLE public.assessment_questions
  ADD COLUMN IF NOT EXISTS center_id UUID REFERENCES public.centers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS created_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_by UUID REFERENCES public.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();

UPDATE public.assessment_tests
SET center_id = u.center_id
FROM public.users u
WHERE assessment_tests.created_by = u.id
  AND assessment_tests.center_id IS NULL;

UPDATE public.assessment_questions q
SET center_id = t.center_id
FROM public.assessment_tests t
WHERE q.test_id = t.id
  AND q.center_id IS NULL;

CREATE INDEX IF NOT EXISTS idx_assessment_tests_center_id ON public.assessment_tests(center_id);
CREATE INDEX IF NOT EXISTS idx_assessment_questions_center_id ON public.assessment_questions(center_id);

COMMIT;
