/**
 * ChartCard Component
 * Card wrapper cho charts
 */

export function ChartCard({ title, subtitle, children, action }) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>
          )}
        </div>
        {action && (
          <div>{action}</div>
        )}
      </div>

      {/* Chart content */}
      <div>
        {children}
      </div>
    </div>
  );
}

export default ChartCard;
