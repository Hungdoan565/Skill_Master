-- Migration: Audit Trail System
-- Creates audit schema, audit.logs table, trigger function, and attaches to critical tables

-- 1. Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- 2. Create audit.logs table
CREATE TABLE audit.logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tenant_id UUID REFERENCES public.centers(id) ON DELETE SET NULL,
  actor_id UUID,
  actor_role TEXT,
  action TEXT NOT NULL CHECK (action IN ('CREATE', 'UPDATE', 'DELETE', 'EXPORT')),
  entity_type TEXT NOT NULL,
  entity_id UUID,
  old_values JSONB,
  new_values JSONB,
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. Indexes
CREATE INDEX idx_audit_logs_created_at ON audit.logs USING BRIN (created_at);
CREATE INDEX idx_audit_logs_tenant_entity ON audit.logs (tenant_id, entity_type, entity_id);
CREATE INDEX idx_audit_logs_actor ON audit.logs (actor_id);
CREATE INDEX idx_audit_logs_action ON audit.logs (action);
CREATE INDEX idx_audit_logs_entity_type ON audit.logs (entity_type);

-- 4. Enable RLS
ALTER TABLE audit.logs ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- SUPER_ADMIN can see all audit logs
CREATE POLICY "super_admin_read_all" ON audit.logs
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'user_role') = 'SUPER_ADMIN'
  );

-- CENTER_MANAGER can see only their center's audit logs
CREATE POLICY "center_manager_read_own" ON audit.logs
  FOR SELECT
  TO authenticated
  USING (
    (current_setting('request.jwt.claims', true)::json->>'user_role') = 'CENTER_MANAGER'
    AND tenant_id = (current_setting('request.jwt.claims', true)::json->>'center_id')::UUID
  );

-- Service role can insert (for triggers and backend)
CREATE POLICY "service_insert" ON audit.logs
  FOR INSERT
  TO service_role
  WITH CHECK (true);

-- Authenticated users can insert (for PG triggers running in user context)
CREATE POLICY "authenticated_insert" ON audit.logs
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- 5. Generic trigger function
CREATE OR REPLACE FUNCTION audit.log_changes()
RETURNS TRIGGER AS $$
DECLARE
  _actor_id UUID;
  _actor_role TEXT;
  _tenant_id UUID;
  _entity_id UUID;
  _action TEXT;
  _old_values JSONB;
  _new_values JSONB;
BEGIN
  -- Extract actor from Supabase JWT context
  BEGIN
    _actor_id := auth.uid();
  EXCEPTION WHEN OTHERS THEN
    _actor_id := NULL;
  END;

  BEGIN
    _actor_role := current_setting('request.jwt.claims', true)::json->>'user_role';
  EXCEPTION WHEN OTHERS THEN
    _actor_role := 'system';
  END;

  -- Determine action, values, entity_id, and tenant_id
  IF TG_OP = 'INSERT' THEN
    _action := 'CREATE';
    _new_values := to_jsonb(NEW);
    _old_values := NULL;
    _entity_id := NEW.id;
    _tenant_id := CASE WHEN TG_TABLE_NAME = 'settings' THEN NEW.center_id ELSE NEW.center_id END;
  ELSIF TG_OP = 'UPDATE' THEN
    _action := 'UPDATE';
    _old_values := to_jsonb(OLD);
    _new_values := to_jsonb(NEW);
    _entity_id := NEW.id;
    _tenant_id := COALESCE(NEW.center_id, OLD.center_id);
  ELSIF TG_OP = 'DELETE' THEN
    _action := 'DELETE';
    _old_values := to_jsonb(OLD);
    _new_values := NULL;
    _entity_id := OLD.id;
    _tenant_id := OLD.center_id;
  END IF;

  -- Insert audit log entry
  INSERT INTO audit.logs (
    tenant_id, actor_id, actor_role, action,
    entity_type, entity_id, old_values, new_values
  ) VALUES (
    _tenant_id, _actor_id, _actor_role, _action,
    TG_TABLE_NAME, _entity_id, _old_values, _new_values
  );

  -- Return appropriate row
  IF TG_OP = 'DELETE' THEN
    RETURN OLD;
  ELSE
    RETURN NEW;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. Attach triggers to critical tables

-- Grades
DROP TRIGGER IF EXISTS audit_grades ON public.grades;
CREATE TRIGGER audit_grades
  AFTER INSERT OR UPDATE OR DELETE ON public.grades
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Attendance
DROP TRIGGER IF EXISTS audit_attendance ON public.attendance;
CREATE TRIGGER audit_attendance
  AFTER INSERT OR UPDATE OR DELETE ON public.attendance
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Payments
DROP TRIGGER IF EXISTS audit_payments ON public.payments;
CREATE TRIGGER audit_payments
  AFTER INSERT OR UPDATE OR DELETE ON public.payments
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Enrollments
DROP TRIGGER IF EXISTS audit_enrollments ON public.enrollments;
CREATE TRIGGER audit_enrollments
  AFTER INSERT OR UPDATE OR DELETE ON public.enrollments
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Students
DROP TRIGGER IF EXISTS audit_students ON public.students;
CREATE TRIGGER audit_students
  AFTER INSERT OR UPDATE OR DELETE ON public.students
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- User Profiles (staff)
DROP TRIGGER IF EXISTS audit_user_profiles ON public.user_profiles;
CREATE TRIGGER audit_user_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();

-- Settings
DROP TRIGGER IF EXISTS audit_settings ON public.settings;
CREATE TRIGGER audit_settings
  AFTER INSERT OR UPDATE OR DELETE ON public.settings
  FOR EACH ROW EXECUTE FUNCTION audit.log_changes();
