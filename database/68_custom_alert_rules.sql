-- Custom Alert Rules System
-- Allows admins to create custom alert rules with configurable thresholds

-- Custom alert rules table
CREATE TABLE IF NOT EXISTS custom_alert_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    center_id UUID REFERENCES centers(id) ON DELETE CASCADE,  -- NULL = all centers
    created_by UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    metric_type VARCHAR(50) NOT NULL CHECK (metric_type IN (
        'revenue_drop', 'low_attendance', 'high_debt', 
        'pending_approvals', 'low_enrollment'
    )),
    condition_operator VARCHAR(10) NOT NULL CHECK (condition_operator IN (
        'gt', 'lt', 'gte', 'lte'
    )),
    threshold_value NUMERIC NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning' CHECK (severity IN (
        'info', 'warning', 'critical'
    )),
    notification_channels TEXT[] NOT NULL DEFAULT ARRAY['in_app'],
    is_active BOOLEAN NOT NULL DEFAULT true,
    cooldown_minutes INTEGER NOT NULL DEFAULT 60,
    last_triggered_at TIMESTAMPTZ,
    trigger_count INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Alert history table  
CREATE TABLE IF NOT EXISTS alert_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    rule_id UUID NOT NULL REFERENCES custom_alert_rules(id) ON DELETE CASCADE,
    center_id UUID REFERENCES centers(id) ON DELETE SET NULL,
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metric_value NUMERIC,
    message TEXT NOT NULL,
    severity VARCHAR(20) NOT NULL DEFAULT 'warning',
    acknowledged BOOLEAN NOT NULL DEFAULT false,
    acknowledged_by UUID REFERENCES users(id) ON DELETE SET NULL,
    acknowledged_at TIMESTAMPTZ
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_center ON custom_alert_rules(center_id);
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_created_by ON custom_alert_rules(created_by);
CREATE INDEX IF NOT EXISTS idx_custom_alert_rules_active ON custom_alert_rules(is_active) WHERE is_active = true;
CREATE INDEX IF NOT EXISTS idx_alert_history_rule ON alert_history(rule_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_center ON alert_history(center_id);
CREATE INDEX IF NOT EXISTS idx_alert_history_triggered ON alert_history(triggered_at DESC);
CREATE INDEX IF NOT EXISTS idx_alert_history_unack ON alert_history(acknowledged) WHERE acknowledged = false;

-- RLS
ALTER TABLE custom_alert_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE alert_history ENABLE ROW LEVEL SECURITY;

-- Policies: service_role full access, authenticated users can read their own
CREATE POLICY "Service role full access on custom_alert_rules"
    ON custom_alert_rules FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view own alert rules"
    ON custom_alert_rules FOR SELECT
    USING (auth.uid() = created_by);

CREATE POLICY "Service role full access on alert_history"
    ON alert_history FOR ALL
    USING (auth.role() = 'service_role');

CREATE POLICY "Users can view alert history for their rules"
    ON alert_history FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM custom_alert_rules
            WHERE custom_alert_rules.id = alert_history.rule_id
            AND custom_alert_rules.created_by = auth.uid()
        )
    );

-- Updated_at trigger
CREATE OR REPLACE FUNCTION update_custom_alert_rules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_custom_alert_rules_updated_at
    BEFORE UPDATE ON custom_alert_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_custom_alert_rules_updated_at();

-- Add comment
COMMENT ON TABLE custom_alert_rules IS 'User-defined custom alert rules with configurable thresholds and notification channels';
COMMENT ON TABLE alert_history IS 'History of triggered alerts from custom alert rules';
