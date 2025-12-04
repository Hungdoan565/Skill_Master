/**
 * CalendarSkeleton - Loading skeleton cho CalendarView
 * Hiển thị placeholder khi đang tải dữ liệu
 */

export function CalendarSkeleton() {
  return (
    <div className="bg-white rounded-2xl shadow-sm p-6 space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="space-y-2">
          <div className="h-6 bg-slate-200 rounded-lg w-48 animate-pulse" />
          <div className="h-4 bg-slate-100 rounded-lg w-32 animate-pulse" />
        </div>
        <div className="flex gap-2">
          <div className="h-10 bg-slate-200 rounded-lg w-24 animate-pulse" />
          <div className="h-10 bg-slate-200 rounded-lg w-24 animate-pulse" />
        </div>
      </div>

      {/* Week view skeleton */}
      <div className="border border-slate-200 rounded-xl overflow-hidden">
        {/* Day headers */}
        <div className="grid grid-cols-8 bg-slate-50">
          <div className="p-2 h-12 bg-slate-100 border-r" />
          {Array.from({ length: 7 }).map((_, i) => (
            <div 
              key={i} 
              className="p-2 h-12 bg-slate-100 border-r flex items-center justify-center"
            >
              <div className="h-4 bg-slate-300 rounded w-12 animate-pulse" />
            </div>
          ))}
        </div>

        {/* Time slots */}
        {Array.from({ length: 6 }).map((_, rowIdx) => (
          <div key={rowIdx} className="grid grid-cols-8 border-b border-slate-100">
            {/* Time header */}
            <div className="p-2 bg-slate-50 border-r flex items-center">
              <div className="h-4 bg-slate-300 rounded w-10 animate-pulse" />
            </div>
            
            {/* Session slots */}
            {Array.from({ length: 7 }).map((_, colIdx) => (
              <div 
                key={colIdx}
                className="p-2 border-r border-slate-100 min-h-20 bg-white"
              >
                {/* Randomly show skeleton cards */}
                {Math.random() > 0.6 && (
                  <div className="space-y-2">
                    <div className="h-3 bg-slate-200 rounded animate-pulse" />
                    <div className="h-2 bg-slate-100 rounded w-16 animate-pulse" />
                    <div className="h-2 bg-slate-100 rounded w-20 animate-pulse" />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      {/* Stats placeholders */}
      <div className="grid grid-cols-4 gap-4 mt-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-slate-100 p-4 rounded-lg">
            <div className="h-4 bg-slate-300 rounded w-16 mb-2 animate-pulse" />
            <div className="h-8 bg-slate-300 rounded w-20 animate-pulse" />
          </div>
        ))}
      </div>
    </div>
  );
}

export default CalendarSkeleton;
