import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

const STATE_LABELS = {
  new: 'Mới',
  assigned: 'Đã giao',
  investigating: 'Đang xử lý',
  resolved: 'Đã xử lý',
  expired: 'Quá hạn',
};

const STATE_COLORS = {
  new: 'border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/50 dark:bg-rose-900/20 dark:text-rose-300',
  assigned: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-900/20 dark:text-blue-300',
  investigating: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-900/20 dark:text-amber-300',
  resolved: 'border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/50 dark:bg-emerald-900/20 dark:text-emerald-300',
  expired: 'border-slate-200 bg-slate-50 text-slate-600 dark:border-slate-700 dark:bg-slate-800/50 dark:text-slate-400',
};

export function AnomalyAlertsWidget({ data }) {
  if (!data) return null;

  const { anomalies = [], all_stable = true } = data;
  const [stateFilter, setStateFilter] = useState('all');

  const filteredAnomalies = useMemo(() => {
    if (stateFilter === 'all') return anomalies;
    return anomalies.filter((a) => a.state === stateFilter);
  }, [anomalies, stateFilter]);

  const alertCount = filteredAnomalies.length;

  return (
    <Card className="admin-surface-card flex h-full flex-col rounded-2xl">
      <CardHeader className="space-y-0 pb-3">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-base font-semibold tracking-tight">Cảnh báo</CardTitle>
          <div className="flex items-center gap-2">
            {/* Styled native select */}
            <select
              value={stateFilter}
              onChange={(e) => setStateFilter(e.target.value)}
              className={cn(
                'admin-focus-ring h-7 rounded-lg border bg-card px-2.5 text-xs text-foreground',
                'appearance-none cursor-pointer transition-colors',
                'hover:border-border focus:outline-none'
              )}
            >
              <option value="all">Tất cả</option>
              {Object.entries(STATE_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
            {alertCount > 0 && (
              <span className="inline-flex min-w-[1.5rem] items-center justify-center rounded-full bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white tabular-nums">
                {alertCount}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="flex-1 overflow-hidden">
        {all_stable || alertCount === 0 ? (
          <div className="flex h-[300px] flex-col items-center justify-center gap-3 text-center">
            <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-emerald-100 bg-emerald-50 dark:border-emerald-900/30 dark:bg-emerald-900/10">
              <CheckCircle2 className="h-7 w-7 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Hệ thống ổn định</p>
              <p className="text-xs text-muted-foreground">Tất cả trung tâm hoạt động bình thường</p>
            </div>
          </div>
        ) : (
          <div className="max-h-[300px] space-y-2.5 overflow-y-auto pr-1">
            {filteredAnomalies.map((anomaly, index) => {
              const isCritical = anomaly.severity === 'critical';
              const stateColor = STATE_COLORS[anomaly.state] || STATE_COLORS.expired;

              return (
                <div
                  key={index}
                  className={cn(
                    'relative rounded-xl border-l-4 bg-muted/25 p-3',
                    isCritical ? 'border-l-rose-500' : 'border-l-amber-500'
                  )}
                >
                  <div className="flex items-start gap-2.5">
                    {isCritical ? (
                      <XCircle className="mt-0.5 h-4 w-4 flex-shrink-0 text-rose-500" />
                    ) : (
                      <AlertTriangle className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-500" />
                    )}
                    <div className="min-w-0 flex-1 space-y-1">
                      <p className="text-sm font-semibold leading-tight text-foreground">
                        {anomaly.center_name}
                      </p>
                      <p className="text-xs text-muted-foreground leading-snug">
                        {anomaly.message}
                      </p>

                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {anomaly.state && (
                          <Badge
                            variant="outline"
                            className={cn('rounded-full px-1.5 py-0 text-[10px] font-medium', stateColor)}
                          >
                            {STATE_LABELS[anomaly.state] || anomaly.state}
                          </Badge>
                        )}
                        {anomaly.owner_role && (
                          <Badge variant="outline" className="rounded-full px-1.5 py-0 text-[10px] font-medium">
                            {anomaly.owner_role}
                          </Badge>
                        )}
                        {anomaly.escalation_required && (
                          <Badge
                            variant="destructive"
                            className="rounded-full px-1.5 py-0 text-[10px] font-medium"
                          >
                            Escalation
                          </Badge>
                        )}
                      </div>

                      {anomaly.created_at && (
                        <div className="flex items-center gap-1 pt-1 text-[10px] text-muted-foreground/70">
                          <Clock className="h-2.5 w-2.5" />
                          {new Date(anomaly.created_at).toLocaleString('vi-VN')}
                        </div>
                      )}
                      {anomaly.due_at && (
                        <p className="text-[10px] text-muted-foreground">
                          Hạn xử lý: {new Date(anomaly.due_at).toLocaleString('vi-VN')}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
