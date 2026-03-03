/**
 * QuickAction Component
 * Nút action nhanh trong dashboard - Đồng bộ icon style
 */

import { ChevronRight } from 'lucide-react';

// Icon colors - muted backgrounds with colored icons (dark mode compatible)
const ICON_STYLES = {
  emerald: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400',
  blue: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400',
  amber: 'bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400',
  red: 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400',
  orange: 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400',
  purple: 'bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400',
};


export function QuickAction({ title, description, icon: Icon, onClick, color = 'emerald' }) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 transition-colors text-left group"
    >
      {/* Icon - rounded-xl, solid color */}
      <div className={`flex-shrink-0 w-11 h-11 rounded-xl ${ICON_STYLES[color] || ICON_STYLES.emerald} flex items-center justify-center transition-transform group-hover:scale-110 duration-300`}>
        <Icon size={22} />
      </div>


      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="font-medium text-foreground">
          {title}
        </p>
        {description && (
          <p className="text-xs text-muted-foreground mt-0.5 truncate">{description}</p>
        )}
      </div>

      {/* Arrow */}
      <ChevronRight size={16} className="text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
    </button>
  );
}

export default QuickAction;
