/**
 * QuickAction Component
 * Nút action nhanh trong dashboard - Đồng bộ icon style
 */

import { ChevronRight } from 'lucide-react';

// Icon colors - đồng bộ với toàn hệ thống
const ICON_COLORS = {
  emerald: 'bg-emerald-500',
  blue: 'bg-blue-500', 
  amber: 'bg-amber-500',
  red: 'bg-red-500',
  orange: 'bg-orange-500',
  purple: 'bg-purple-500',
};

export function QuickAction({ title, description, icon: Icon, onClick, color = 'emerald' }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
    >
      {/* Icon - rounded-xl, solid color */}
      <div className={`flex-shrink-0 w-10 h-10 rounded-xl ${ICON_COLORS[color] || ICON_COLORS.emerald} flex items-center justify-center`}>
        <Icon size={20} className="text-white" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-gray-900">
          {title}
        </p>
        {description && (
          <p className="text-xs text-gray-500 mt-0.5 truncate">{description}</p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-500 transition-colors" />
    </button>
  );
}

export default QuickAction;
