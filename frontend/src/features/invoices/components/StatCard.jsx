/**
 * StatCard Component
 * 
 * Pure UI component hiển thị thẻ thống kê KPI.
 * Redesigned: Icon ở trên, số liệu ở dưới - không bị xung đột khi số lớn
 * 
 * @param {string} title - Tiêu đề thẻ
 * @param {string|number} value - Giá trị hiển thị
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} description - Mô tả phụ (optional)
 * @param {string} accentColor - Màu accent: red | emerald | amber | blue | orange
 * @param {function} onClick - Handler khi click (optional)
 * @param {boolean} highlight - Highlight card (pulse animation)
 */

import { ArrowUpRight } from 'lucide-react';

const ACCENT_COLORS = {
  red: { bg: 'bg-red-50 dark:bg-red-900/30', icon: 'bg-red-500', text: 'text-red-600 dark:text-red-400' },
  emerald: { bg: 'bg-emerald-50 dark:bg-emerald-900/30', icon: 'bg-emerald-500', text: 'text-emerald-600 dark:text-emerald-400' },
  amber: { bg: 'bg-amber-50 dark:bg-amber-900/30', icon: 'bg-amber-500', text: 'text-amber-600 dark:text-amber-400' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/30', icon: 'bg-blue-500', text: 'text-blue-600 dark:text-blue-400' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/30', icon: 'bg-orange-500', text: 'text-orange-600 dark:text-orange-400' },
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  accentColor = 'red', 
  onClick,
  highlight = false
}) {
  const colors = ACCENT_COLORS[accentColor] || ACCENT_COLORS.red;

  return (
    <div 
      className={`
        group relative bg-white dark:bg-zinc-900 rounded-2xl overflow-hidden
        shadow-sm shadow-stone-900/5 border border-stone-200/60 dark:border-zinc-700/60
        hover:shadow-lg hover:shadow-stone-900/10 dark:hover:shadow-black/20 hover:border-stone-300/60 dark:hover:border-zinc-600/60
        transition-all duration-300 
        ${onClick ? 'cursor-pointer' : ''}
        ${highlight ? 'ring-2 ring-orange-400 ring-offset-2 dark:ring-offset-zinc-950 animate-pulse' : ''}
      `}
      onClick={onClick}
    >
      {/* Header with icon */}
      <div className={`px-4 pt-4 pb-3 ${colors.bg}`}>
        <div className="flex items-center justify-between">
          <div className={`p-2 rounded-lg ${colors.icon}`}>
            <Icon className="h-5 w-5 text-white" />
          </div>
          {onClick && (
            <ArrowUpRight 
              className="w-4 h-4 text-zinc-400 group-hover:text-zinc-600 transition-colors" 
            />
          )}
        </div>
        <p className="text-sm font-medium text-zinc-600 dark:text-zinc-300 mt-2">{title}</p>
      </div>
      
      {/* Value section */}
      <div className="px-4 py-3">
        <p className={`text-2xl font-bold tracking-tight ${colors.text}`}>
          {value}
        </p>
        {description && (
          <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 truncate">{description}</p>
        )}
      </div>
    </div>
  );
}

export default StatCard;
