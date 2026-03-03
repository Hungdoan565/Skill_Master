import { cn } from '@/lib/utils';
import { Users, Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Component hiển thị danh sách lớp học của giáo viên
 */
export function ClassesSummary({ classes = [] }) {
    if (classes.length === 0) {
        return (
            <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    Lớp học đang dạy
                </h3>
                <div className="text-center py-8 text-muted-foreground">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-muted-foreground/50" />
                    <p>Chưa có lớp học nào</p>
                    <p className="text-sm mt-1">Bạn sẽ thấy danh sách lớp khi được phân công</p>
                </div>
            </div>
        );
    }

    const getProgressColor = (progress) => {
        if (progress >= 80) return 'bg-green-500';
        if (progress >= 50) return 'bg-blue-500';
        if (progress >= 25) return 'bg-amber-500';
        return 'bg-muted-foreground';
    };

    const formatSchedule = (schedule) => {
        if (!schedule) return 'Chưa có lịch';
        // Schedule format: "T2,T4,T6 18:00-20:00" or similar
        return schedule;
    };

    return (
        <div className="rounded-2xl border border-border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground flex items-center gap-2">
                    <BookOpen className="h-5 w-5 text-purple-500" />
                    Lớp học đang dạy
                </h3>
                <Link
                    to="/teacher/classes"
                    className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 flex items-center gap-1"
                >
                    Xem tất cả <ChevronRight className="h-4 w-4" />
                </Link>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {classes.slice(0, 4).map((classItem) => {
                    const progress = classItem.progress || 0;

                    return (
                        <div
                            key={classItem.id}
                            className="rounded-lg border border-border p-4 hover:border-blue-500/50 hover:shadow-sm transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Class name */}
                                    <h4 className="font-medium text-foreground truncate">
                                        {classItem.name}
                                    </h4>

                                    {/* Course name */}
                                    <p className="text-sm text-muted-foreground truncate">
                                        {classItem.course_name}
                                    </p>
                                </div>

                                {/* Status badge */}
                                <span className={cn(
                                    'px-2 py-0.5 text-xs font-medium rounded-full shrink-0',
                                    classItem.status === 'active' ? 'bg-green-500/20 text-green-700 dark:text-green-400' :
                                        classItem.status === 'upcoming' ? 'bg-blue-500/20 text-blue-700 dark:text-blue-400' :
                                            classItem.status === 'completed' ? 'bg-muted text-foreground' :
                                                'bg-muted text-muted-foreground'
                                )}>
                                    {classItem.status === 'active' ? 'Đang học' :
                                        classItem.status === 'upcoming' ? 'Sắp khai giảng' :
                                            classItem.status === 'completed' ? 'Hoàn thành' :
                                                classItem.status}
                                </span>
                            </div>

                            {/* Class info */}
                            <div className="mt-3 flex items-center gap-4 text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                    <Users className="h-4 w-4" />
                                    {classItem.student_count || 0} học viên
                                </span>
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-4 w-4" />
                                    {classItem.total_sessions || 0} buổi
                                </span>
                            </div>

                            {/* Schedule */}
                            <div className="mt-2 text-sm text-muted-foreground flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatSchedule(classItem.schedule)}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-muted-foreground">Tiến độ</span>
                                    <span className="font-medium text-foreground">
                                        {classItem.completed_sessions || 0}/{classItem.total_sessions || 0} buổi ({progress}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-muted rounded-full overflow-hidden">
                                    <div
                                        className={cn(
                                            'h-full rounded-full transition-all duration-500',
                                            getProgressColor(progress)
                                        )}
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {classes.length > 4 && (
                <div className="mt-4 text-center">
                    <Link
                        to="/teacher/classes"
                        className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300"
                    >
                        Xem thêm {classes.length - 4} lớp học khác →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default ClassesSummary;
