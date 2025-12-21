/**
 * SimplePieChart Component
 * Biểu đồ phân bố học viên - clean design với progress bars
 */

const COLORS = [
  { dot: 'bg-red-500', bar: 'bg-red-500', light: 'bg-red-50' },
  { dot: 'bg-orange-500', bar: 'bg-orange-500', light: 'bg-orange-50' },
  { dot: 'bg-amber-500', bar: 'bg-amber-500', light: 'bg-amber-50' },
  { dot: 'bg-emerald-500', bar: 'bg-emerald-500', light: 'bg-emerald-50' },
  { dot: 'bg-blue-500', bar: 'bg-blue-500', light: 'bg-blue-50' },
  { dot: 'bg-indigo-500', bar: 'bg-indigo-500', light: 'bg-indigo-50' },
];

export function SimplePieChart({ data }) {
  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[240px] text-gray-400">
        <svg className="w-14 h-14 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20.488 9H15V3.512A9.025 9.025 0 0120.488 9z" />
        </svg>
        <p className="text-sm font-medium">Chưa có học viên nào</p>
        <p className="text-xs mt-1">Thêm học viên để xem phân bố</p>
      </div>
    );
  }

  const total = data.reduce((sum, d) => sum + (d.value || 0), 0);
  const maxValue = Math.max(...data.map(d => d.value || 0));

  // Sort and take top 6
  const items = [...data]
    .sort((a, b) => (b.value || 0) - (a.value || 0))
    .slice(0, 6)
    .map((d, i) => ({
      ...d,
      percentage: total > 0 ? Math.round((d.value / total) * 100) : 0,
      color: COLORS[i % COLORS.length]
    }));

  return (
    <div className="space-y-3">
      {items.map((item, i) => (
        <div key={i} className="group">
          {/* Row: dot + name + count + percentage */}
          <div className="flex items-center gap-3 mb-1.5">
            <span className={`w-2 h-2 rounded-full ${item.color.dot} flex-shrink-0`} />
            <span className="flex-1 text-sm text-gray-700 truncate">{item.name}</span>
            <span className="text-sm font-semibold text-gray-900 tabular-nums">{item.value}</span>
            <span className="text-xs text-gray-400 w-10 text-right">{item.percentage}%</span>
          </div>

          {/* Progress bar */}
          <div className={`h-1.5 rounded-full ${item.color.light} ml-5 overflow-hidden`}>
            <div
              className={`h-full rounded-full ${item.color.bar} transition-all duration-300`}
              style={{ width: `${maxValue > 0 ? (item.value / maxValue) * 100 : 0}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

export default SimplePieChart;
