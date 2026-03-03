import { Target } from 'lucide-react';

export default function CenterKPIWidget({ targets = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-36 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map(i => (
            <div key={i} className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-3 w-full bg-muted rounded-full animate-pulse" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!targets || targets.length === 0) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
              <Target className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Mục tiêu tháng</h3>
              <p className="text-sm text-muted-foreground">Tiến độ đạt mục tiêu</p>
            </div>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-50 mb-3">
            <Target className="h-7 w-7 text-indigo-400" />
          </div>
          <p className="text-sm font-medium text-muted-foreground">Chưa có mục tiêu được thiết lập</p>
        </div>
      </div>
    );
  }

  const getProgressColor = (pct) => {
    if (pct >= 80) return { bar: 'bg-emerald-500', text: 'text-emerald-600', bg: 'bg-emerald-50' };
    if (pct >= 50) return { bar: 'bg-amber-500', text: 'text-amber-600', bg: 'bg-amber-50' };
    return { bar: 'bg-red-500', text: 'text-red-600', bg: 'bg-red-50' };
  };

  const formatValue = (value, type) => {
    if (type === 'currency') {
      if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
      if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}M`;
      if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
      return value?.toLocaleString('vi-VN') || '0';
    }
    if (type === 'percentage') return `${value}%`;
    return value?.toString() || '0';
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-500/10 via-purple-500/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-500 shadow-lg shadow-indigo-500/25">
            <Target className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Mục tiêu tháng</h3>
            <p className="text-sm text-muted-foreground">Tiến độ đạt mục tiêu</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {targets.map((target, idx) => {
          const pct = Math.min(100, Math.round((target.current / (target.target || 1)) * 100));
          const colors = getProgressColor(pct);
          return (
            <div key={idx} className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">{target.label}</span>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>
                  {pct}%
                </span>
              </div>
              <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full ${colors.bar} transition-all duration-500`}
                  style={{ width: `${pct}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-xs text-muted-foreground">
                <span>Hiện tại: {formatValue(target.current, target.type)}</span>
                <span>Mục tiêu: {formatValue(target.target, target.type)}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
