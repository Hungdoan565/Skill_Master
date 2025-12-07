import { cn } from '@/lib/utils';
import { Users, Calendar, Clock, BookOpen, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';

/**
 * Component hiển thị danh sách lớp học của giáo viên
 */
export function ClassesSummary({ classes = [] }) {
    if (classes.length === 0) {
        return (
            <div className="rounded-xl border bg-white p-6 shadow-sm">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    📚 Lớp học đang dạy
                </h3>
                <div className="text-center py-8 text-gray-500">
                    <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
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
        return 'bg-gray-400';
    };

    const formatSchedule = (schedule) => {
        if (!schedule) return 'Chưa có lịch';
        // Schedule format: "T2,T4,T6 18:00-20:00" or similar
        return schedule;
    };

    return (
        <div className="rounded-xl border bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                    📚 Lớp học đang dạy
                </h3>
                <Link
                    to="/teacher/classes"
                    className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
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
                            className="rounded-lg border border-gray-200 p-4 hover:border-blue-300 hover:shadow-sm transition-all"
                        >
                            <div className="flex items-start justify-between gap-3">
                                <div className="flex-1 min-w-0">
                                    {/* Class name */}
                                    <h4 className="font-medium text-gray-900 truncate">
                                        {classItem.name}
                                    </h4>

                                    {/* Course name */}
                                    <p className="text-sm text-gray-500 truncate">
                                        {classItem.course_name}
                                    </p>
                                </div>

                                {/* Status badge */}
                                <span className={cn(
                                    'px-2 py-0.5 text-xs font-medium rounded-full shrink-0',
                                    classItem.status === 'active' ? 'bg-green-100 text-green-700' :
                                        classItem.status === 'upcoming' ? 'bg-blue-100 text-blue-700' :
                                            classItem.status === 'completed' ? 'bg-gray-100 text-gray-700' :
                                                'bg-gray-100 text-gray-600'
                                )}>
                                    {classItem.status === 'active' ? 'Đang học' :
                                        classItem.status === 'upcoming' ? 'Sắp khai giảng' :
                                            classItem.status === 'completed' ? 'Hoàn thành' :
                                                classItem.status}
                                </span>
                            </div>

                            {/* Class info */}
                            <div className="mt-3 flex items-center gap-4 text-sm text-gray-600">
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
                            <div className="mt-2 text-sm text-gray-500 flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {formatSchedule(classItem.schedule)}
                            </div>

                            {/* Progress bar */}
                            <div className="mt-3">
                                <div className="flex items-center justify-between text-xs mb-1">
                                    <span className="text-gray-500">Tiến độ</span>
                                    <span className="font-medium text-gray-700">
                                        {classItem.completed_sessions || 0}/{classItem.total_sessions || 0} buổi ({progress}%)
                                    </span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
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
                        className="text-sm text-blue-600 hover:text-blue-700"
                    >
                        Xem thêm {classes.length - 4} lớp học khác →
                    </Link>
                </div>
            )}
        </div>
    );
}

export default ClassesSummary;
