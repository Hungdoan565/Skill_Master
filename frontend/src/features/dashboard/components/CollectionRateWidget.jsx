import { Wallet } from 'lucide-react';

export default function CollectionRateWidget({ data = {}, loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-28 bg-muted rounded animate-pulse" />
              <div className="h-3 w-20 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4 space-y-3">
          <div className="h-24 bg-slate-50 rounded-xl animate-pulse" />
          <div className="h-16 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const { total_expected = 0, total_collected = 0, collection_percentage = 0, overdue_amount = 0, aging_buckets = {} } = data;

  const formatCurrency = (val) => {
    if (!val) return '0đ';
    if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(1)}B`;
    if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(1)}M`;
    if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
    return `${val.toLocaleString('vi-VN')}đ`;
  };

  const pct = Math.round(collection_percentage);
  const rateColor = pct >= 80 ? 'text-emerald-600' : pct >= 50 ? 'text-amber-600' : 'text-red-600';
  const rateBg = pct >= 80 ? 'bg-emerald-500' : pct >= 50 ? 'bg-amber-500' : 'bg-red-500';

  const buckets = [
    { label: '1-15 ngày', amount: aging_buckets.bucket_1_15 || 0, color: 'bg-amber-100 text-amber-700' },
    { label: '16-30 ngày', amount: aging_buckets.bucket_16_30 || 0, color: 'bg-orange-100 text-orange-700' },
    { label: '30+ ngày', amount: aging_buckets.bucket_30_plus || 0, color: 'bg-red-100 text-red-700' },
  ];

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-teal-500/10 via-cyan-500/5 to-transparent p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg shadow-teal-500/25">
            <Wallet className="h-5 w-5 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-foreground">Thu học phí</h3>
            <p className="text-sm text-muted-foreground">Tình trạng thu tháng này</p>
          </div>
        </div>
      </div>
      <div className="p-4 space-y-4">
        {/* Collection rate circle */}
        <div className="flex items-center gap-4 p-3 rounded-xl bg-muted/30">
          <div className="relative flex h-16 w-16 items-center justify-center">
            <svg className="h-16 w-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" strokeWidth="6" className="stroke-muted/30" />
              <circle
                cx="32" cy="32" r="28" fill="none" strokeWidth="6"
                className={`${rateBg.replace('bg-', 'stroke-')}`}
                strokeDasharray={`${pct * 1.76} 176`}
                strokeLinecap="round"
              />
            </svg>
            <span className={`absolute text-sm font-bold ${rateColor}`}>{pct}%</span>
          </div>
          <div className="flex-1 space-y-1">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Đã thu</span>
              <span className="font-medium text-foreground">{formatCurrency(total_collected)}</span>
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Cần thu</span>
              <span className="font-medium text-foreground">{formatCurrency(total_expected)}</span>
            </div>
            {overdue_amount > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-500">Quá hạn</span>
                <span className="font-medium text-red-600">{formatCurrency(overdue_amount)}</span>
              </div>
            )}
          </div>
        </div>

        {/* Aging buckets */}
        {overdue_amount > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Phân loại nợ quá hạn</p>
            <div className="flex flex-wrap gap-2">
              {buckets.map((b) => (
                b.amount > 0 && (
                  <span key={b.label} className={`inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium ${b.color}`}>
                    {b.label}: {formatCurrency(b.amount)}
                  </span>
                )
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
