import { Clock, MapPin, CalendarDays, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const formatDateOnlyLocal = (date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
};

/**
 * Component hiển thị lịch dạy 7 ngày tới
 */
export function UpcomingSessions({ sessions = [] }) {
    const formatTime = (time) => {
        if (!time) return '--:--';
        return time.slice(0, 5);
    };

    const formatDate = (dateStr) => {
        const date = new Date(dateStr + 'T00:00:00');
        const today = new Date();
        const tomorrow = new Date(today);
        tomorrow.setDate(today.getDate() + 1);
        const todayStr = formatDateOnlyLocal(today);
        const tomorrowStr = formatDateOnlyLocal(tomorrow);

        if (dateStr === todayStr) return 'Hôm nay';
        if (dateStr === tomorrowStr) return 'Ngày mai';

        return date.toLocaleDateString('vi-VN', { weekday: 'short', month: 'numeric', day: 'numeric' });
    };

    // Group sessions by date
    const grouped = sessions.reduce((acc, session) => {
        const date = session.session_date;
        if (!acc[date]) acc[date] = [];
        acc[date].push(session);
        return acc;
    }, {});

    const sortedDates = Object.keys(grouped).sort();

    return (
        <div className="overflow-hidden rounded-2xl border border-border bg-card/95 shadow-sm shadow-black/5 dark:shadow-black/20">
            <div className="p-5 border-b border-border/50 bg-slate-50/50 dark:bg-muted/20 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5 text-blue-500" />
                    <h3 className="text-base font-semibold text-foreground">Lịch sắp tới</h3>
                </div>
                <Link
                    to="/teacher/schedule"
                    className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-0.5"
                >
                    Xem đầy đủ <ChevronRight className="h-3 w-3" />
                </Link>
            </div>

            {sortedDates.length === 0 ? (
                <div className="p-5 text-center text-muted-foreground">
                    <CalendarDays className="h-10 w-10 mx-auto mb-2 text-muted-foreground/30" />
                    <p className="text-sm">Không có lịch dạy trong 7 ngày tới</p>
                </div>
            ) : (
                <div className="divide-y divide-border/50">
                    {sortedDates.map(date => (
                        <div key={date} className="px-4 py-3">
                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                {formatDate(date)}
                            </p>
                            <div className="space-y-2">
                                {grouped[date].map(session => (
                                    <div key={session.id} className="flex items-center gap-3 text-sm">
                                        <div className="flex items-center gap-1 text-muted-foreground min-w-[80px]">
                                            <Clock className="h-3.5 w-3.5 shrink-0" />
                                            <span className="text-xs">{formatTime(session.start_time)}</span>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-foreground truncate text-xs">
                                                {session.classes?.name || 'Lớp học'}
                                            </p>
                                            {(session.classes?.rooms?.name) && (
                                                <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                                    <MapPin className="h-3 w-3" />
                                                    {session.classes.rooms.name}
                                                </p>
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}

export default UpcomingSessions;
