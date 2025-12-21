/**
 * SimpleAreaChart Component
 * Biểu đồ line chart clean - giống dashboard gốc
 * Thêm hover tooltip hiển thị số tiền
 */

import { useState } from 'react';

// Format số tiền
const formatCurrency = (value) => {
  if (!value) return '0đ';
  if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B đ`;
  if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M đ`;
  if (value >= 1000) return `${(value / 1000).toFixed(0)}K đ`;
  return `${value}đ`;
};

export function SimpleAreaChart({ data, dataKey, height = 280 }) {
  const [hoveredIndex, setHoveredIndex] = useState(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });

  if (!data || data.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-[280px] text-gray-400">
        <svg className="w-16 h-16 mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
        </svg>
        <p className="text-sm font-medium">Chưa có dữ liệu doanh thu</p>
        <p className="text-xs mt-1">Dữ liệu sẽ hiển thị khi có giao dịch</p>
      </div>
    );
  }

  // Calculate chart dimensions
  const maxValue = Math.max(...data.map(d => d[dataKey] || 0)) * 1.15;
  const minValue = 0;
  const chartPadding = { top: 20, right: 10, bottom: 30, left: 50 };

  // Generate points
  const getX = (index) => {
    const chartWidth = 100 - ((chartPadding.left + chartPadding.right) / 4);
    return chartPadding.left / 4 + (index / (data.length - 1)) * chartWidth;
  };

  const getY = (value) => {
    const chartHeight = 100 - ((chartPadding.top + chartPadding.bottom) / 3);
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    return chartPadding.top / 3 + (1 - normalizedValue) * chartHeight;
  };

  // Create smooth line path
  const createPath = () => {
    const points = data.map((d, i) => ({
      x: getX(i),
      y: getY(d[dataKey] || 0)
    }));

    if (points.length < 2) return '';

    let path = `M ${points[0].x},${points[0].y}`;

    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i - 1] || points[i];
      const p1 = points[i];
      const p2 = points[i + 1];
      const p3 = points[i + 2] || p2;

      const tension = 0.35;
      const cp1x = p1.x + (p2.x - p0.x) * tension;
      const cp1y = p1.y + (p2.y - p0.y) * tension;
      const cp2x = p2.x - (p3.x - p1.x) * tension;
      const cp2y = p2.y - (p3.y - p1.y) * tension;

      path += ` C ${cp1x},${cp1y} ${cp2x},${cp2y} ${p2.x},${p2.y}`;
    }

    return path;
  };

  const linePath = createPath();
  const points = data.map((d, i) => ({
    x: getX(i),
    y: getY(d[dataKey] || 0),
    value: d[dataKey] || 0,
    label: d.label || d.month
  }));

  // Create area path
  const areaPath = `${linePath} L ${points[points.length - 1].x},${getY(0)} L ${points[0].x},${getY(0)} Z`;

  // Y-axis labels
  const yLabels = [0, maxValue / 2, maxValue].map(v => formatCurrency(v));

  return (
    <div className="relative" style={{ height }}>
      {/* Y-axis labels */}
      <div className="absolute left-0 top-4 bottom-8 w-12 flex flex-col justify-between text-xs text-gray-400">
        <span>{yLabels[2]}</span>
        <span>{yLabels[1]}</span>
        <span>{yLabels[0]}</span>
      </div>

      {/* Chart */}
      <div className="absolute left-14 right-0 top-0 bottom-0">
        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="w-full h-full"
          style={{ overflow: 'visible' }}
        >
          {/* Gradient */}
          <defs>
            <linearGradient id="chartGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#f97316" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#f97316" stopOpacity="0" />
            </linearGradient>
          </defs>

          {/* Horizontal grid lines - dashed, subtle */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, i) => {
            const y = getY(minValue + (maxValue - minValue) * (1 - ratio));
            return (
              <line
                key={i}
                x1={points[0]?.x || 0}
                y1={y}
                x2={points[points.length - 1]?.x || 100}
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.3"
                strokeDasharray="1.5,1.5"
              />
            );
          })}

          {/* Area fill */}
          <path
            d={areaPath}
            fill="url(#chartGradient)"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="#f97316"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {points.map((point, i) => (
            <g key={i}>
              {/* Invisible larger hit area for hover */}
              <circle
                cx={point.x}
                cy={point.y}
                r="4"
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={(e) => {
                  setHoveredIndex(i);
                  const rect = e.currentTarget.getBoundingClientRect();
                  const parentRect = e.currentTarget.closest('svg').getBoundingClientRect();
                  setTooltipPos({
                    x: rect.left - parentRect.left + rect.width / 2,
                    y: rect.top - parentRect.top
                  });
                }}
                onMouseLeave={() => setHoveredIndex(null)}
              />
              {/* Visible dot */}
              <circle
                cx={point.x}
                cy={point.y}
                r={hoveredIndex === i ? "1.8" : "1.2"}
                fill={hoveredIndex === i ? "#f97316" : "#fff"}
                stroke="#f97316"
                strokeWidth={hoveredIndex === i ? "1.5" : "1"}
                vectorEffect="non-scaling-stroke"
                className="transition-all duration-150 pointer-events-none"
              />
            </g>
          ))}
        </svg>

        {/* Tooltip */}
        {hoveredIndex !== null && (
          <div
            className="absolute z-10 transform -translate-x-1/2 -translate-y-full pointer-events-none"
            style={{
              left: `${(points[hoveredIndex].x / 100) * 100}%`,
              top: `${(points[hoveredIndex].y / 100) * 100 - 8}%`
            }}
          >
            <div className="bg-gray-900 text-white text-xs font-medium px-2.5 py-1.5 rounded-lg shadow-lg whitespace-nowrap">
              <div className="text-gray-400 text-[10px]">{points[hoveredIndex].label}</div>
              <div className="text-orange-400 font-semibold">{formatCurrency(points[hoveredIndex].value)}</div>
            </div>
            <div className="absolute left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-900"></div>
          </div>
        )}

        {/* X-axis labels */}
        <div className="absolute left-0 right-0 bottom-0 h-6 flex justify-between text-xs text-gray-400">
          {data.map((d, i) => (
            <span
              key={i}
              className={`${hoveredIndex === i ? 'text-orange-500 font-medium' : ''} transition-colors`}
              style={{ width: `${100 / data.length}%`, textAlign: 'center' }}
            >
              {d.label || d.month}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

export default SimpleAreaChart;
