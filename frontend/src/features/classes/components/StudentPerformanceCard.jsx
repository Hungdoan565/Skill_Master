/**
 * StudentPerformanceCard Component
 * Displays individual student performance metrics including:
 * - Attendance rate
 * - Average grade  
 * - Class rank
 * - Trend analysis
 * - Alerts for at-risk students
 */

import { useState } from 'react';
import {
    TrendingUp,
    TrendingDown,
    Minus,
    AlertTriangle,
    CheckCircle,
    XCircle,
    Calendar,
    BookOpen,
    Award,
    Clock,
    DollarSign,
    ChevronDown,
    ChevronUp,
    User,
    Target
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';

// Performance thresholds
const THRESHOLDS = {
    ATTENDANCE_WARNING: 80,  // < 80% = warning
    ATTENDANCE_DANGER: 60,   // < 60% = danger
    GRADE_WARNING: 6.5,      // < 6.5 = warning
    GRADE_DANGER: 5.0,       // < 5.0 = danger (failing)
};

// Trend icons
const TrendIcon = ({ trend }) => {
    switch (trend) {
        case 'improving':
            return <TrendingUp className="w-4 h-4 text-green-500" />;
        case 'declining':
            return <TrendingDown className="w-4 h-4 text-red-500" />;
        default:
            return <Minus className="w-4 h-4 text-slate-400" />;
    }
};

// Progress bar component
const ProgressBar = ({ value, max = 100, colorClass = 'bg-indigo-500' }) => {
    const percentage = Math.min(100, Math.max(0, (value / max) * 100));
    return (
        <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${colorClass}`}
                style={{ width: `${percentage}%` }}
            />
        </div>
    );
};

// Alert badge component
const AlertBadge = ({ type, message }) => {
    const config = {
        danger: { bg: 'bg-red-50', text: 'text-red-700', icon: AlertTriangle },
        warning: { bg: 'bg-amber-50', text: 'text-amber-700', icon: AlertTriangle },
        success: { bg: 'bg-green-50', text: 'text-green-700', icon: CheckCircle },
    };
    const { bg, text, icon: Icon } = config[type] || config.warning;

    return (
        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${bg} ${text}`}>
            <Icon className="w-3 h-3" />
            {message}
        </div>
    );
};

// Stat item component
const StatItem = ({ icon: Icon, label, value, subValue, colorClass = 'text-slate-600' }) => (
    <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg">
        <div className={`p-2 rounded-lg bg-white ${colorClass}`}>
            <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
            <p className="text-xs text-slate-500">{label}</p>
            <p className="font-semibold text-slate-900">{value}</p>
            {subValue && <p className="text-xs text-slate-400">{subValue}</p>}
        </div>
    </div>
);

// Calculate performance level
const getPerformanceLevel = (performance) => {
    if (!performance) return { level: 'unknown', color: 'slate', label: 'Chưa có dữ liệu' };

    const { attendanceRate, averageGrade } = performance;

    // Check for danger conditions
    if (attendanceRate < THRESHOLDS.ATTENDANCE_DANGER || averageGrade < THRESHOLDS.GRADE_DANGER) {
        return { level: 'danger', color: 'red', label: 'Cần hỗ trợ' };
    }

    // Check for warning conditions
    if (attendanceRate < THRESHOLDS.ATTENDANCE_WARNING || averageGrade < THRESHOLDS.GRADE_WARNING) {
        return { level: 'warning', color: 'amber', label: 'Cần chú ý' };
    }

    // Good performance
    if (averageGrade >= 8) {
        return { level: 'excellent', color: 'green', label: 'Xuất sắc' };
    }

    return { level: 'good', color: 'blue', label: 'Tốt' };
};

// Get color class for attendance
const getAttendanceColor = (rate) => {
    if (rate >= THRESHOLDS.ATTENDANCE_WARNING) return 'bg-green-500';
    if (rate >= THRESHOLDS.ATTENDANCE_DANGER) return 'bg-amber-500';
    return 'bg-red-500';
};

// Get color class for grade
const getGradeColor = (grade) => {
    if (grade >= 8) return 'text-green-600';
    if (grade >= THRESHOLDS.GRADE_WARNING) return 'text-blue-600';
    if (grade >= THRESHOLDS.GRADE_DANGER) return 'text-amber-600';
    return 'text-red-600';
};

export function StudentPerformanceCard({
    student,
    performance,
    rank,
    totalStudents,
    onViewDetail,
    compact = false
}) {
    const [expanded, setExpanded] = useState(false);

    const performanceLevel = getPerformanceLevel(performance);

    // Build alerts array
    const alerts = [];
    if (performance) {
        if (performance.attendanceRate < THRESHOLDS.ATTENDANCE_DANGER) {
            alerts.push({ type: 'danger', message: 'Điểm danh rất thấp' });
        } else if (performance.attendanceRate < THRESHOLDS.ATTENDANCE_WARNING) {
            alerts.push({ type: 'warning', message: 'Điểm danh thấp' });
        }

        if (performance.averageGrade !== null) {
            if (performance.averageGrade < THRESHOLDS.GRADE_DANGER) {
                alerts.push({ type: 'danger', message: 'Điểm dưới TB' });
            } else if (performance.averageGrade < THRESHOLDS.GRADE_WARNING) {
                alerts.push({ type: 'warning', message: 'Điểm cần cải thiện' });
            }
        }

        if (performance.paymentStatus === 'unpaid') {
            alerts.push({ type: 'warning', message: 'Còn nợ học phí' });
        }
    }

    if (compact) {
        return (
            <div className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
                <div className="flex items-center gap-3">
                    <Avatar name={student.name} size="sm" url={student.avatarUrl} />
                    <div>
                        <p className="font-medium text-sm text-slate-900">{student.name}</p>
                        <p className="text-xs text-slate-500">#{rank}/{totalStudents}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="text-right">
                        <p className={`font-semibold ${getGradeColor(performance?.averageGrade || 0)}`}>
                            {performance?.averageGrade?.toFixed(1) || '—'}
                        </p>
                        <p className="text-xs text-slate-400">{performance?.attendanceRate || 0}% ĐD</p>
                    </div>
                    {alerts.length > 0 && (
                        <div className="w-2 h-2 rounded-full bg-amber-500" title={alerts.map(a => a.message).join(', ')} />
                    )}
                </div>
            </div>
        );
    }

    return (
        <div className={`bg-white border rounded-xl overflow-hidden transition-all ${performanceLevel.level === 'danger' ? 'border-red-200' :
                performanceLevel.level === 'warning' ? 'border-amber-200' :
                    'border-slate-200'
            }`}>
            {/* Header */}
            <div className="p-4 border-b border-slate-100">
                <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                        <Avatar name={student.name} size="md" url={student.avatarUrl} />
                        <div>
                            <h4 className="font-semibold text-slate-900">{student.name}</h4>
                            <p className="text-sm text-slate-500">{student.email}</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-${performanceLevel.color}-50 text-${performanceLevel.color}-700`}>
                            {performanceLevel.label}
                        </span>
                        <span className="text-sm font-medium text-slate-500">
                            #{rank}/{totalStudents}
                        </span>
                    </div>
                </div>

                {/* Alerts */}
                {alerts.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                        {alerts.map((alert, idx) => (
                            <AlertBadge key={idx} type={alert.type} message={alert.message} />
                        ))}
                    </div>
                )}
            </div>

            {/* Stats Grid */}
            <div className="p-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                {/* Attendance */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Điểm danh</span>
                        <span className="font-semibold text-slate-900">
                            {performance?.attendanceRate || 0}%
                        </span>
                    </div>
                    <ProgressBar
                        value={performance?.attendanceRate || 0}
                        colorClass={getAttendanceColor(performance?.attendanceRate || 0)}
                    />
                    <p className="text-xs text-slate-400">
                        {performance?.presentCount || 0}/{performance?.totalSessions || 0} buổi
                    </p>
                </div>

                {/* Average Grade */}
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-xs text-slate-500">Điểm TB</span>
                        <span className={`font-semibold ${getGradeColor(performance?.averageGrade || 0)}`}>
                            {performance?.averageGrade?.toFixed(1) || '—'}
                        </span>
                    </div>
                    <ProgressBar
                        value={performance?.averageGrade || 0}
                        max={10}
                        colorClass={performance?.averageGrade >= 5 ? 'bg-blue-500' : 'bg-red-500'}
                    />
                    <div className="flex items-center gap-1 text-xs text-slate-400">
                        <TrendIcon trend={performance?.trend} />
                        {performance?.trend === 'improving' ? 'Tiến bộ' :
                            performance?.trend === 'declining' ? 'Giảm' : 'Ổn định'}
                    </div>
                </div>

                {/* Completed Assignments */}
                <div className="text-center p-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-indigo-50 mb-1">
                        <BookOpen className="w-5 h-5 text-indigo-600" />
                    </div>
                    <p className="font-semibold text-slate-900">{performance?.completedAssignments || 0}</p>
                    <p className="text-xs text-slate-500">Bài đã nộp</p>
                </div>

                {/* Last Activity */}
                <div className="text-center p-2">
                    <div className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-green-50 mb-1">
                        <Clock className="w-5 h-5 text-green-600" />
                    </div>
                    <p className="font-semibold text-slate-900">
                        {performance?.lastAttendance
                            ? new Date(performance.lastAttendance).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' })
                            : '—'
                        }
                    </p>
                    <p className="text-xs text-slate-500">Lần ĐD cuối</p>
                </div>
            </div>

            {/* Expandable Details */}
            {expanded && (
                <div className="p-4 bg-slate-50 border-t border-slate-100 space-y-4">
                    {/* Grade Breakdown */}
                    {performance?.gradeBreakdown && performance.gradeBreakdown.length > 0 && (
                        <div>
                            <h5 className="text-sm font-medium text-slate-700 mb-2">Chi tiết điểm</h5>
                            <div className="space-y-2">
                                {performance.gradeBreakdown.map((item, idx) => (
                                    <div key={idx} className="flex items-center justify-between text-sm">
                                        <span className="text-slate-600">{item.name}</span>
                                        <span className={`font-medium ${getGradeColor(item.score)}`}>
                                            {item.score?.toFixed(1) || '—'}/{item.maxScore}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Payment Info */}
                    <div className="grid grid-cols-2 gap-3">
                        <StatItem
                            icon={DollarSign}
                            label="Học phí"
                            value={new Intl.NumberFormat('vi-VN').format(performance?.tuitionFee || 0) + 'đ'}
                            colorClass="text-slate-500"
                        />
                        <StatItem
                            icon={performance?.paymentStatus === 'paid' ? CheckCircle : AlertTriangle}
                            label="Thanh toán"
                            value={performance?.paymentStatus === 'paid' ? 'Đã đóng đủ' : 'Còn nợ'}
                            subValue={performance?.remainingAmount > 0
                                ? `Còn ${new Intl.NumberFormat('vi-VN').format(performance.remainingAmount)}đ`
                                : null
                            }
                            colorClass={performance?.paymentStatus === 'paid' ? 'text-green-600' : 'text-amber-600'}
                        />
                    </div>

                    {/* Recent Activity */}
                    <div>
                        <h5 className="text-sm font-medium text-slate-700 mb-2">Hoạt động gần đây</h5>
                        <div className="space-y-2 text-sm text-slate-600">
                            {performance?.recentAttendance?.slice(0, 5).map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between">
                                    <span>{new Date(item.date).toLocaleDateString('vi-VN')}</span>
                                    <span className={`font-medium ${item.status === 'present' ? 'text-green-600' :
                                            item.status === 'absent' ? 'text-red-600' :
                                                item.status === 'late' ? 'text-amber-600' : 'text-slate-400'
                                        }`}>
                                        {item.status === 'present' ? 'Có mặt' :
                                            item.status === 'absent' ? 'Vắng' :
                                                item.status === 'late' ? 'Muộn' : 'Có phép'}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Footer */}
            <div className="flex items-center justify-between p-3 bg-slate-50 border-t border-slate-100">
                <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setExpanded(!expanded)}
                    className="text-slate-600"
                >
                    {expanded ? (
                        <>
                            <ChevronUp className="w-4 h-4 mr-1" />
                            Thu gọn
                        </>
                    ) : (
                        <>
                            <ChevronDown className="w-4 h-4 mr-1" />
                            Chi tiết
                        </>
                    )}
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewDetail?.(student)}
                >
                    <User className="w-4 h-4 mr-1" />
                    Hồ sơ
                </Button>
            </div>
        </div>
    );
}

export default StudentPerformanceCard;
