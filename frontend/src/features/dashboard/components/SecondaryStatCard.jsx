/**
 * SecondaryStatCard Component
 * Card hiển thị stat phụ với layout compact
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { formatTrend } from '../utils';

export function SecondaryStatCard({ title, value, trend, icon: Icon, color = 'gray' }) {
  const trendValue = formatTrend(trend);
  const isPositive = trend > 0;

  const colorClasses = {
    gray: 'from-gray-500 to-gray-600',
    emerald: 'from-emerald-500 to-teal-500',
    amber: 'from-amber-500 to-orange-500',
    red: 'from-red-500 to-orange-500',
  };

  return (
    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
      {/* Icon */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br ${colorClasses[color] || colorClasses.gray} flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>
      
      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium text-gray-500 truncate">{title}</p>
        <p className="text-lg font-bold text-gray-900">{value}</p>
      </div>
      
      {/* Trend */}
      {trendValue && (
        <div className={`flex items-center gap-1 text-xs font-semibold ${isPositive ? 'text-emerald-600' : 'text-red-600'}`}>
          {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
          {trendValue}
        </div>
      )}
    </div>
  );
}

export default SecondaryStatCard;
