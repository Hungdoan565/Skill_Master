/**
 * PrimaryStatCard Component
 * Card hiển thị stat chính với icon lớn và trend
 */

import { TrendingUp, TrendingDown } from 'lucide-react';
import { ACCENT_CLASSES } from '../utils';
import { formatTrend } from '../utils';

export function PrimaryStatCard({ title, value, trend, trendLabel, icon: Icon, accent = 'red' }) {
  const accentStyle = ACCENT_CLASSES[accent] || ACCENT_CLASSES.red;
  const trendValue = formatTrend(trend);
  const isPositive = trend > 0;

  return (
    <div className="group relative overflow-hidden rounded-2xl bg-card p-6 shadow-sm border border-gray-100 hover:shadow-lg transition-all duration-300">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-32 h-32 opacity-5 transform translate-x-8 -translate-y-8">
        <Icon size={128} />
      </div>
      
      <div className="relative">
        {/* Icon */}
        <div className={`inline-flex items-center justify-center w-12 h-12 rounded-xl ${accentStyle.iconBg} shadow-lg ${accentStyle.iconShadow} mb-4`}>
          <Icon size={24} className="text-white" />
        </div>
        
        {/* Title */}
        <p className="text-sm font-medium text-gray-500 mb-1">{title}</p>
        
        {/* Value */}
        <h3 className="text-3xl font-bold text-gray-900 mb-2">{value}</h3>
        
        {/* Trend */}
        {trendValue && (
          <div className="flex items-center gap-2">
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-semibold ${isPositive ? accentStyle.trendUp : accentStyle.trendDown}`}>
              {isPositive ? <TrendingUp size={12} /> : <TrendingDown size={12} />}
              {trendValue}
            </span>
            {trendLabel && (
              <span className="text-xs text-gray-500">{trendLabel}</span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default PrimaryStatCard;
