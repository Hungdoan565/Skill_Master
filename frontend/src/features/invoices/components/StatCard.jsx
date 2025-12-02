/**
 * StatCard Component
 * 
 * Pure UI component hiển thị thẻ thống kê KPI.
 * Dùng chung cho nhiều module (Invoices, Dashboard, etc.)
 * 
 * @param {string} title - Tiêu đề thẻ
 * @param {string|number} value - Giá trị hiển thị
 * @param {React.ComponentType} icon - Lucide icon component
 * @param {string} description - Mô tả phụ (optional)
 * @param {string} accentColor - Màu accent: red | emerald | amber | blue
 * @param {function} onClick - Handler khi click (optional)
 */

import { ArrowUpRight } from 'lucide-react';

const ACCENT_CLASSES = {
  red: 'from-red-500 to-orange-500 shadow-red-500/25',
  emerald: 'from-emerald-500 to-teal-500 shadow-emerald-500/25',
  amber: 'from-amber-500 to-orange-500 shadow-amber-500/25',
  blue: 'from-blue-500 to-indigo-500 shadow-blue-500/25',
};

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  description, 
  accentColor = 'red', 
  onClick 
}) {
  const accentClass = ACCENT_CLASSES[accentColor] || ACCENT_CLASSES.red;

  return (
    <div 
      className={`
        group relative bg-white rounded-2xl p-5 
        shadow-sm shadow-stone-900/5 border border-stone-200/60
        hover:shadow-lg hover:shadow-stone-900/10 hover:border-stone-300/60
        transition-all duration-300 
        ${onClick ? 'cursor-pointer' : ''}
      `}
      onClick={onClick}
    >
      <div className="flex items-start gap-4">
        {/* Icon Container */}
        <div 
          className={`
            flex h-12 w-12 items-center justify-center rounded-xl 
            bg-gradient-to-br ${accentClass} shadow-lg
          `}
        >
          <Icon className="h-6 w-6 text-white" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-500">{title}</p>
          <p className="font-display text-2xl font-bold text-zinc-900 tracking-tight mt-0.5">
            {value}
          </p>
          {description && (
            <p className="text-xs text-zinc-400 mt-1">{description}</p>
          )}
        </div>

        {/* Click indicator */}
        {onClick && (
          <ArrowUpRight 
            className="w-4 h-4 text-zinc-300 group-hover:text-zinc-500 transition-colors" 
          />
        )}
      </div>
    </div>
  );
}

export default StatCard;
