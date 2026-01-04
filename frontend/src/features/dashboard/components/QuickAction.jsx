/**
 * QuickAction Component
 * Nút action nhanh trong dashboard - Đồng bộ icon style
 */

import { ChevronRight } from 'lucide-react';

// Icon colors - đồng bộ với toàn hệ thống
// Icon colors - muted backgrounds with colored icons
const ICON_STYLES = {
  emerald: 'bg-emerald-50 text-emerald-600',
  blue: 'bg-blue-50 text-blue-600',
  amber: 'bg-amber-50 text-amber-600',
  red: 'bg-red-50 text-red-600',
  orange: 'bg-orange-50 text-orange-600',
  purple: 'bg-purple-50 text-purple-600',
};


export function QuickAction({ title, description, icon: Icon, onClick, color = 'emerald' }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-gray-50 transition-colors text-left group"
    >
      {/* Icon - rounded-xl, solid color */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${ICON_STYLES[color] || ICON_STYLES.emerald} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
        <Icon size={22} />
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
