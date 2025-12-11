/**
 * WeeklyCalendarView Component
 * Displays sessions in a weekly calendar grid format
 * Similar to school timetable view
 */

import { useState, useMemo } from 'react';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Clock,
    User,
    CheckCircle2,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// Days of the week configuration
const WEEKDAYS = [
    { key: 1, name: 'Thứ 2', shortName: 'T2' },
    { key: 2, name: 'Thứ 3', shortName: 'T3' },
    { key: 3, name: 'Thứ 4', shortName: 'T4' },
    { key: 4, name: 'Thứ 5', shortName: 'T5' },
    { key: 5, name: 'Thứ 6', shortName: 'T6' },
    { key: 6, name: 'Thứ 7', shortName: 'T7' },
    { key: 0, name: 'Chủ nhật', shortName: 'CN' }
];

export function WeeklyCalendarView({ sessions, onSessionClick }) {
    // Current week state
    const [currentDate, setCurrentDate] = useState(() => new Date());

    // Get week range (Monday to Sunday)
    const weekRange = useMemo(() => {
        const date = new Date(currentDate);
        const day = date.getDay();
        // Adjust to get Monday (day 0 = Sunday, so we need to go back to Monday)
        const diff = day === 0 ? -6 : 1 - day;

        const monday = new Date(date);
        monday.setDate(date.getDate() + diff);
        monday.setHours(0, 0, 0, 0);

        const sunday = new Date(monday);
        sunday.setDate(monday.getDate() + 6);
        sunday.setHours(23, 59, 59, 999);

        // Generate all dates in the week
        const dates = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date(monday);
            d.setDate(monday.getDate() + i);
            dates.push(d);
        }

        return { monday, sunday, dates };
    }, [currentDate]);

    // Filter sessions for current week
    const weekSessions = useMemo(() => {
        if (!sessions) return {};

        const sessionsByDay = {};

        sessions.forEach(session => {
            // Parse session date as local
            const [year, month, day] = session.date.split('-').map(Number);
            const sessionDate = new Date(year, month - 1, day);

            // Check if session is in current week
            if (sessionDate >= weekRange.monday && sessionDate <= weekRange.sunday) {
                const dayOfWeek = sessionDate.getDay();
                if (!sessionsByDay[dayOfWeek]) {
                    sessionsByDay[dayOfWeek] = [];
                }
                sessionsByDay[dayOfWeek].push({
                    ...session,
                    dateObj: sessionDate
                });
            }
        });

        // Sort sessions by time within each day
        Object.keys(sessionsByDay).forEach(day => {
            sessionsByDay[day].sort((a, b) => a.start_time.localeCompare(b.start_time));
        });

        return sessionsByDay;
    }, [sessions, weekRange]);

    // Navigation
    const goToPreviousWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() - 7);
        setCurrentDate(newDate);
    };

    const goToNextWeek = () => {
        const newDate = new Date(currentDate);
        newDate.setDate(newDate.getDate() + 7);
        setCurrentDate(newDate);
    };

    const goToToday = () => {
        setCurrentDate(new Date());
    };

    // Check if current week contains today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const isCurrentWeek = today >= weekRange.monday && today <= weekRange.sunday;

    // Format month/year for header
    const formatWeekHeader = () => {
        const startMonth = weekRange.monday.toLocaleDateString('vi-VN', { month: 'long' });
        const endMonth = weekRange.sunday.toLocaleDateString('vi-VN', { month: 'long' });
        const year = weekRange.monday.getFullYear();

        if (startMonth === endMonth) {
            return `${startMonth} ${year}`;
        }
        return `${startMonth} - ${endMonth} ${year}`;
    };

    return (
        <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            {/* Header with navigation */}
            <div className="flex items-center justify-between px-4 py-3 bg-slate-50 border-b border-slate-200">
                <div className="flex items-center gap-2">
                    <Calendar className="w-5 h-5 text-indigo-600" />
                    <span className="font-semibold text-slate-900">{formatWeekHeader()}</span>
                </div>

                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToPreviousWeek}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronLeft className="w-4 h-4" />
                    </Button>

                    <Button
                        variant={isCurrentWeek ? "default" : "outline"}
                        size="sm"
                        onClick={goToToday}
                        className="h-8 px-3"
                    >
                        Hiện tại
                    </Button>

                    <Button
                        variant="outline"
                        size="sm"
                        onClick={goToNextWeek}
                        className="h-8 w-8 p-0"
                    >
                        <ChevronRight className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            {/* Calendar Grid */}
            <div className="overflow-x-auto">
                <table className="w-full min-w-[700px]">
                    {/* Header row with weekdays */}
                    <thead>
                        <tr className="bg-slate-100">
                            {WEEKDAYS.map((day, index) => {
                                const date = weekRange.dates[index];
                                const isToday = date && date.toDateString() === new Date().toDateString();

                                return (
                                    <th
                                        key={day.key}
                                        className={`
                      px-2 py-3 text-center border-r border-slate-200 last:border-r-0
                      ${isToday ? 'bg-indigo-100' : ''}
                    `}
                                    >
                                        <div className={`
                      text-sm font-semibold
                      ${isToday ? 'text-indigo-700' : 'text-slate-700'}
                    `}>
                                            {day.name}
                                        </div>
                                        <div className={`
                      text-xs mt-0.5
                      ${isToday ? 'text-indigo-600 font-medium' : 'text-slate-500'}
                    `}>
                                            {date ? date.toLocaleDateString('vi-VN', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric'
                                            }) : ''}
                                        </div>
                                    </th>
                                );
                            })}
                        </tr>
                    </thead>

                    {/* Body with sessions */}
                    <tbody>
                        <tr>
                            {WEEKDAYS.map((day, index) => {
                                const daySessions = weekSessions[day.key] || [];
                                const date = weekRange.dates[index];
                                const isToday = date && date.toDateString() === new Date().toDateString();

                                return (
                                    <td
                                        key={day.key}
                                        className={`
                      p-2 border-r border-slate-200 last:border-r-0 align-top
                      min-h-[120px] h-[120px]
                      ${isToday ? 'bg-indigo-50/50' : 'bg-white'}
                    `}
                                    >
                                        <div className="space-y-2">
                                            {daySessions.length === 0 ? (
                                                <div className="text-center text-slate-300 text-xs py-4">
                                                    —
                                                </div>
                                            ) : (
                                                daySessions.map((session, idx) => (
                                                    <SessionCard
                                                        key={session.id || idx}
                                                        session={session}
                                                        onClick={() => onSessionClick?.(session)}
                                                    />
                                                ))
                                            )}
                                        </div>
                                    </td>
                                );
                            })}
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Legend */}
            <div className="px-4 py-3 bg-slate-50 border-t border-slate-200">
                <div className="flex flex-wrap items-center gap-4 text-xs">
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-indigo-500" />
                        <span className="text-slate-600">Hôm nay</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-slate-300" />
                        <span className="text-slate-600">Đã học</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded bg-blue-100 border border-blue-300" />
                        <span className="text-slate-600">Sắp tới</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3 h-3 text-green-500" />
                        <span className="text-slate-600">Đã điểm danh</span>
                    </div>
                </div>
            </div>
        </div>
    );
}

// Session card component
function SessionCard({ session, onClick }) {
    const isToday = session.status === 'today';
    const isCompleted = session.status === 'completed';
    const hasAttendance = session.is_marked;

    // Determine card style
    const cardStyle = isToday
        ? 'bg-indigo-500 text-white border-indigo-600'
        : isCompleted
            ? 'bg-slate-200 text-slate-700 border-slate-300'
            : 'bg-blue-50 text-blue-900 border-blue-200';

    return (
        <div
            onClick={onClick}
            className={`
        p-2 rounded-lg border cursor-pointer transition-all
        hover:shadow-md hover:-translate-y-0.5
        ${cardStyle}
      `}
        >
            {/* Session number */}
            <div className="flex items-center justify-between mb-1">
                <span className={`
          text-xs font-bold px-1.5 py-0.5 rounded
          ${isToday ? 'bg-white/20' : isCompleted ? 'bg-slate-300' : 'bg-blue-100'}
        `}>
                    #{session.session_number}
                </span>

                {hasAttendance && (
                    <CheckCircle2 className={`w-3.5 h-3.5 ${isToday ? 'text-white' : 'text-green-500'}`} />
                )}
            </div>

            {/* Time */}
            <div className={`
        flex items-center gap-1 text-xs mb-1
        ${isToday ? 'text-white/90' : 'text-slate-600'}
      `}>
                <Clock className="w-3 h-3" />
                <span>{session.start_time} - {session.end_time}</span>
            </div>

            {/* Teacher */}
            {session.teacher && (
                <div className={`
          flex items-center gap-1 text-xs truncate
          ${isToday ? 'text-white/80' : 'text-slate-500'}
        `}>
                    <User className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{session.teacher.full_name}</span>
                </div>
            )}

            {/* Attendance summary if marked */}
            {hasAttendance && session.attendance_summary && (
                <div className={`
          mt-1 pt-1 border-t text-xs
          ${isToday ? 'border-white/20 text-white/80' : 'border-slate-300 text-slate-500'}
        `}>
                    <span className="text-green-600">{session.attendance_summary.present || 0}</span>
                    <span className="mx-0.5">/</span>
                    <span>{session.total_students || 0} HV</span>
                </div>
            )}
        </div>
    );
}

export default WeeklyCalendarView;
