import { CalendarCheck } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';

export default function WeeklyAttendanceWidget({ data = [], loading = false }) {
  if (loading) {
    return (
      <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
        <div className="bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent p-4">
          <div className="flex items-center gap-3">
            <div className="h-11 w-11 rounded-xl bg-muted animate-pulse" />
            <div className="space-y-2">
              <div className="h-4 w-40 bg-muted rounded animate-pulse" />
              <div className="h-3 w-24 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </div>
        <div className="p-4">
          <div className="h-48 bg-slate-50 rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  const avg = data.length > 0
    ? Math.round(data.reduce((sum, d) => sum + (d.rate || 0), 0) / data.length)
    : 0;

  const minDay = data.length > 0
    ? data.reduce((min, d) => (d.rate || 100) < (min.rate || 100) ? d : min, data[0])
    : null;

  const chartData = data.map(d => ({
    ...d,
    fill: d.rate === minDay?.rate ? '#f59e0b' : '#06b6d4',
  }));

  const CustomTooltip = ({ active, payload }) => {
    if (active && payload?.[0]) {
      const d = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg shadow-lg p-2.5 text-xs">
          <p className="font-medium text-foreground">{d.label || d.day}</p>
          <p className="text-muted-foreground">Tỷ lệ: <span className="font-bold text-foreground">{d.rate}%</span></p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-border overflow-hidden">
      <div className="bg-gradient-to-r from-cyan-500/10 via-sky-500/5 to-transparent p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-500 to-sky-500 shadow-lg shadow-cyan-500/25">
              <CalendarCheck className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground">Điểm danh tuần</h3>
              <p className="text-sm text-muted-foreground">7 ngày gần nhất</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Trung bình</p>
              <p className="text-lg font-bold text-foreground">{avg}%</p>
            </div>
            {minDay && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Thấp nhất</p>
                <p className="text-sm font-medium text-amber-600">{minDay.day}: {minDay.rate}%</p>
              </div>
            )}
          </div>
        </div>
      </div>
      <div className="p-4">
        {data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <CalendarCheck className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">Chưa có dữ liệu điểm danh</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" vertical={false} />
              <XAxis dataKey="day" tick={{ fontSize: 12 }} className="text-muted-foreground" />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} className="text-muted-foreground" unit="%" />
              <Tooltip content={<CustomTooltip />} />
              <ReferenceLine y={avg} stroke="#94a3b8" strokeDasharray="4 4" />
              <Bar dataKey="rate" radius={[6, 6, 0, 0]} maxBarSize={36}>
                {chartData.map((entry, index) => (
                  <rect key={index} fill={entry.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
