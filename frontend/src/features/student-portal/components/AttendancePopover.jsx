import { format } from 'date-fns';
import { vi as localeVi } from 'date-fns/locale';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { cn } from '@/lib/utils';
import { Check, X, Clock, Minus } from 'lucide-react';

const STATUS_MAP = {
  present: { label: 'Có mặt', badge: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', icon: Check },
  absent: { label: 'Vắng mặt', badge: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-400', dot: 'bg-rose-500', icon: X },
  late: { label: 'Đi trễ', badge: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400', dot: 'bg-amber-500', icon: Clock },
  excused: { label: 'Có phép', badge: 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', icon: Minus },
};

export function AttendancePopover({ date, records, children }) {
  if (!records || records.length === 0) return children;

  return (
    <Popover>
      <PopoverTrigger asChild>
        {children}
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="center" side="top" sideOffset={6}>
        <div className="px-3 py-2 border-b border-border bg-muted/60">
          <p className="text-sm font-semibold">
            {format(date, 'EEEE, dd/MM/yyyy', { locale: localeVi })}
          </p>
          <p className="text-xs text-muted-foreground">{records.length} buổi học</p>
        </div>
        <div className="divide-y divide-border max-h-48 overflow-y-auto">
          {records.map((record, idx) => {
            const config = STATUS_MAP[record.status] || STATUS_MAP.present;
            const Icon = config.icon;
            return (
              <div key={record.id || idx} className="px-3 py-2.5">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium truncate">{record.class_name}</p>
                  <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] font-medium', config.badge)}>
                    <Icon className="h-3 w-3" />
                    {config.label}
                  </span>
                </div>
                {record.course_title && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{record.course_title}</p>
                )}
                <div className="flex items-center gap-3 mt-1.5 text-xs text-muted-foreground">
                  {record.check_in_time && (
                    <span>Giờ vào: {String(record.check_in_time).slice(0, 5)}</span>
                  )}
                  {record.notes && (
                    <span className="truncate">📝 {record.notes}</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </PopoverContent>
    </Popover>
  );
}
