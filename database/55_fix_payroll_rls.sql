-- ============================================================
-- FIX: Payroll RLS Policies - Restrict to Admin/Manager only
-- Version: 55
-- Description: SECURITY FIX - Replace overly permissive payroll RLS
--   policies that allowed ANY authenticated user to modify payrolls.
--   Now restricted to SUPER_ADMIN and CENTER_MANAGER roles only.
-- ============================================================

-- Drop existing overly permissive policies
DROP POLICY IF EXISTS "Authenticated users can view payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can insert payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can update payroll" ON public.payroll;
DROP POLICY IF EXISTS "Authenticated users can delete payroll" ON public.payroll;

-- Admin/Manager can view all payrolls
CREATE POLICY "Admin can view all payroll" ON public.payroll
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can insert payrolls
CREATE POLICY "Admin can insert payroll" ON public.payroll
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can update payrolls
CREATE POLICY "Admin can update payroll" ON public.payroll
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Admin/Manager can delete payrolls (draft only enforced by backend)
CREATE POLICY "Admin can delete payroll" ON public.payroll
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM public.users u
      JOIN public.roles r ON u.role_id = r.id
      WHERE u.id = auth.uid()
      AND r.code IN ('SUPER_ADMIN', 'CENTER_MANAGER')
    )
  );

-- Keep existing teacher self-view policy (already correct)
-- "Teacher can view own payroll" already exists from 11_payroll_upgrade.sql

-- ============================================================
-- DONE!
-- ============================================================
