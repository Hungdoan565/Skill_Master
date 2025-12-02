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
      <div className="flex items-center justify-center h-[240px] text-gray-400">
        <p>Không có dữ liệu</p>
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
