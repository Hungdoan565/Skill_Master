import { useMemo } from 'react';

/**
 * Custom SVG sparkline with gradient fill.
 * Handles 0, 1, or N data points gracefully.
 */
export function TrendSparkline({ data = [], width = 300, height = 60, className = '' }) {
  const points = useMemo(() => {
    if (!data || data.length === 0) return [];
    const max = Math.max(...data, 100);
    const min = 0;
    const range = max - min || 1;
    const stepX = data.length > 1 ? width / (data.length - 1) : width / 2;

    return data.map((val, i) => ({
      x: data.length > 1 ? i * stepX : width / 2,
      y: height - ((val - min) / range) * (height - 8) - 4,
    }));
  }, [data, width, height]);

  if (data.length === 0) {
    return (
      <div className={className} style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <line
            x1={0} y1={height - 4} x2={width} y2={height - 4}
            stroke="#cbd5e1" strokeWidth={1.5} strokeDasharray="4 4"
          />
          <text x={width / 2} y={height / 2} textAnchor="middle" fill="#94a3b8" fontSize={10}>
            Chưa có dữ liệu
          </text>
        </svg>
      </div>
    );
  }

  if (data.length === 1) {
    return (
      <div className={className} style={{ width, height }}>
        <svg width={width} height={height} className="overflow-visible">
          <defs>
            <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#10b981" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
            </linearGradient>
          </defs>
          <circle cx={points[0].x} cy={points[0].y} r={4} fill="#10b981" />
          <text x={points[0].x} y={points[0].y - 8} textAnchor="middle" fill="#10b981" fontSize={10} fontWeight="600">
            {data[0].toFixed(1)}%
          </text>
        </svg>
      </div>
    );
  }

  // Build path
  const linePath = points.map((p, i) => `${i === 0 ? 'M' : 'L'}${p.x},${p.y}`).join(' ');
  const areaPath = `${linePath} L${points[points.length - 1].x},${height} L${points[0].x},${height} Z`;

  return (
    <div className={className} style={{ width: '100%', height }}>
      <svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" className="overflow-visible">
        <defs>
          <linearGradient id="sparkline-grad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#10b981" stopOpacity="0.02" />
          </linearGradient>
        </defs>
        <path d={areaPath} fill="url(#sparkline-grad)" />
        <path d={linePath} fill="none" stroke="#10b981" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" />
        {points.map((p, i) => (
          <circle key={i} cx={p.x} cy={p.y} r={2.5} fill="#10b981" />
        ))}
      </svg>
    </div>
  );
}
