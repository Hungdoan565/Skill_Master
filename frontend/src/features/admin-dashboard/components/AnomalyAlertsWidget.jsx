import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2, AlertTriangle, XCircle, Clock } from 'lucide-react';

const STATE_LABELS = {
  new: 'Mới',
  assigned: 'Đã giao',
  investigating: 'Đang xử lý',
  resolved: 'Đã xử lý',
  expired: 'Quá hạn',
};

export function AnomalyAlertsWidget({ data }) {
  if (!data) return null;

  const { anomalies = [], all_stable = true } = data;
  const [stateFilter, setStateFilter] = useState('all');
  const filteredAnomalies = useMemo(() => {
    if (stateFilter === 'all') return anomalies;
    return anomalies.filter((anomaly) => anomaly.state === stateFilter);
  }, [anomalies, stateFilter]);

  const alertCount = filteredAnomalies.length;

  return (
    <Card className="flex flex-col h-full bg-white border shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <CardTitle className="text-lg font-semibold text-foreground">Cảnh báo</CardTitle>
        <div className="flex items-center gap-2">
          <select
            value={stateFilter}
            onChange={(event) => setStateFilter(event.target.value)}
            className="h-7 rounded-md border bg-white px-2 text-xs text-foreground"
          >
            <option value="all">Tất cả trạng thái</option>
            {Object.entries(STATE_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
          {alertCount > 0 && (
            <Badge variant="destructive" className="ml-2">
              {alertCount}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="flex-1">
        {all_stable || alertCount === 0 ? (
          <div className="flex flex-col items-center justify-center h-[300px] text-center space-y-4">
            <div className="h-16 w-16 rounded-full bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-green-600 dark:text-green-400" />
            </div>
            <div className="space-y-1">
              <p className="text-sm font-semibold text-foreground">Hệ thống ổn định</p>
              <p className="text-sm font-medium text-muted-foreground">Tất cả trung tâm hoạt động bình thường</p>
            </div>
          </div>
        ) : (
          <div className="space-y-4 overflow-y-auto max-h-[300px] pr-2 mt-2">
            {filteredAnomalies.map((anomaly, index) => {
              const isCritical = anomaly.severity === 'critical';
              return (
                <div 
                  key={index} 
                  className={`flex items-start space-x-3 p-3 rounded-lg bg-muted/30 border-l-4 shadow-sm
                    ${isCritical ? 'border-l-red-500' : 'border-l-amber-500'}`}
                >
                  {isCritical ? (
                    <XCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5 shrink-0" />
                  )}
                  <div className="flex-1 space-y-1">
                    <p className="text-sm font-semibold text-foreground">{anomaly.center_name}</p>
                    <p className="text-sm text-muted-foreground">{anomaly.message}</p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {anomaly.state && (
                        <Badge variant="outline" className="text-[10px]">
                          {STATE_LABELS[anomaly.state] || anomaly.state}
                        </Badge>
                      )}
                      {anomaly.owner_role && (
                        <Badge variant="outline" className="text-[10px]">
                          Owner: {anomaly.owner_role}
                        </Badge>
                      )}
                      {anomaly.escalation_required && (
                        <Badge variant="destructive" className="text-[10px]">Escalation</Badge>
                      )}
                    </div>
                    {anomaly.created_at && (
                      <div className="flex items-center text-xs text-muted-foreground/70 mt-2">
                        <Clock className="h-3 w-3 mr-1" />
                        {new Date(anomaly.created_at).toLocaleString('vi-VN')}
                      </div>
                    )}
                    {anomaly.due_at && (
                      <div className="text-xs text-muted-foreground mt-1">
                        Hạn xử lý: {new Date(anomaly.due_at).toLocaleString('vi-VN')}
                      </div>
                    )}
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
