-- Fix RLS policies for custom_alert_rules
-- The INSERT/UPDATE/DELETE policies were missing, causing 500 errors on POST /api/admin/custom-alerts

-- INSERT policy: authenticated users can create their own rules
CREATE POLICY "Users can insert own custom alert rules"
    ON custom_alert_rules FOR INSERT
    WITH CHECK (auth.uid() = created_by);

-- UPDATE policy: users can update their own rules
CREATE POLICY "Users can update own custom alert rules"
    ON custom_alert_rules FOR UPDATE
    USING (auth.uid() = created_by);

-- DELETE policy: users can delete their own rules
CREATE POLICY "Users can delete own custom alert rules"
    ON custom_alert_rules FOR DELETE
    USING (auth.uid() = created_by);

-- Also fix alert_history: authenticated users can acknowledge their own alerts
CREATE POLICY "Users can update own alert history"
    ON alert_history FOR UPDATE
    USING (
        EXISTS (
            SELECT 1 FROM custom_alert_rules
            WHERE custom_alert_rules.id = alert_history.rule_id
            AND custom_alert_rules.created_by = auth.uid()
        )
    );

COMMENT ON POLICY "Users can insert own custom alert rules" ON custom_alert_rules IS 'Allows authenticated users to create their own custom alert rules';
COMMENT ON POLICY "Users can update own custom alert rules" ON custom_alert_rules IS 'Allows users to update their own custom alert rules';
COMMENT ON POLICY "Users can delete own custom alert rules" ON custom_alert_rules IS 'Allows users to delete their own custom alert rules';
