/**
 * ClassReportModal Component
 * Generate and export detailed reports for a class
 */

import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import {
    X,
    FileText,
    Download,
    BarChart3,
    Users,
    Calendar,
    GraduationCap,
    Clock,
    CheckCircle,
    AlertCircle,
    Loader2,
    TrendingUp,
    DollarSign,
    UserCheck,
    Percent,
    FileSpreadsheet
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Report types
const REPORT_TYPES = [
    {
        id: 'attendance',
        name: 'Báo cáo điểm danh',
        description: 'Thống kê điểm danh theo buổi, học viên',
        icon: UserCheck,
        color: 'blue'
    },
    {
        id: 'progress',
        name: 'Báo cáo tiến độ',
        description: 'Tiến độ khóa học, số buổi hoàn thành',
        icon: TrendingUp,
        color: 'green'
    },
    {
        id: 'grades',
        name: 'Báo cáo điểm số',
        description: 'Bảng điểm chi tiết các học viên',
        icon: GraduationCap,
        color: 'purple'
    },
    {
        id: 'payment',
        name: 'Báo cáo học phí',
        description: 'Tình hình thu học phí, công nợ',
        icon: DollarSign,
        color: 'amber'
    },
    {
        id: 'summary',
        name: 'Báo cáo tổng hợp',
        description: 'Tất cả thông tin trong một báo cáo',
        icon: FileText,
        color: 'slate'
    }
];

export function ClassReportModal({
    show,
    onClose,
    classId,
    classData
}) {
    const { session } = useAuth();

    const getAuthHeaders = () => ({
        'Authorization': `Bearer ${session?.access_token}`,
        'Content-Type': 'application/json'
    });

    const isOpen = show;
    const students = [];
    const sessions = [];
    const grades = [];
    // State
    const [selectedReport, setSelectedReport] = useState('');
    const [generating, setGenerating] = useState(false);
    const [reportData, setReportData] = useState(null);
    const [error, setError] = useState(null);

    // Generate report data
    const generateReport = useCallback(async () => {
        if (!selectedReport) return;

        setGenerating(true);
        setError(null);
        setReportData(null);

        try {
            // Calculate report data based on type
            let data = {};

            switch (selectedReport) {
                case 'attendance':
                    data = generateAttendanceReport(sessions, students);
                    break;
                case 'progress':
                    data = generateProgressReport(classData, sessions);
                    break;
                case 'grades':
                    data = generateGradesReport(students, grades);
                    break;
                case 'payment':
                    data = generatePaymentReport(students, classData);
                    break;
                case 'summary':
                    data = {
                        attendance: generateAttendanceReport(sessions, students),
                        progress: generateProgressReport(classData, sessions),
                        grades: generateGradesReport(students, grades),
                        payment: generatePaymentReport(students, classData)
                    };
                    break;
            }

            setReportData(data);
        } catch (err) {
            setError(err.message || 'Có lỗi xảy ra khi tạo báo cáo');
        } finally {
            setGenerating(false);
        }
    }, [selectedReport, classData, students, sessions, grades]);

    // Export to CSV
    const exportToCSV = useCallback(() => {
        if (!reportData) return;

        let csvContent = '';
        const reportType = REPORT_TYPES.find(r => r.id === selectedReport);

        // Header
        csvContent += `BÁO CÁO: ${reportType?.name?.toUpperCase()}\n`;
        csvContent += `Lớp: ${classData?.name}\n`;
        csvContent += `Ngày xuất: ${new Date().toLocaleDateString('vi-VN')}\n\n`;

        // Content based on report type
        if (selectedReport === 'attendance' && reportData.studentStats) {
            csvContent += 'Họ tên,Có mặt,Vắng,Trễ,Tỷ lệ\n';
            reportData.studentStats.forEach(student => {
                csvContent += `"${student.name}",${student.present},${student.absent},${student.late},${student.rate}%\n`;
            });
        }

        if (selectedReport === 'progress') {
            csvContent += 'Thông tin,Giá trị\n';
            csvContent += `Tổng buổi,${reportData.totalSessions}\n`;
            csvContent += `Đã học,${reportData.completedSessions}\n`;
            csvContent += `Còn lại,${reportData.remainingSessions}\n`;
            csvContent += `Tiến độ,${reportData.progressPercent}%\n`;
        }

        if (selectedReport === 'grades' && reportData.students) {
            csvContent += 'Họ tên,Điểm TB\n';
            reportData.students.forEach(student => {
                csvContent += `"${student.name}",${student.average}\n`;
            });
        }

        if (selectedReport === 'payment') {
            csvContent += 'Thông tin,Giá trị\n';
            csvContent += `Tổng học viên,${reportData.totalStudents}\n`;
            csvContent += `Đã đóng đủ,${reportData.paidCount}\n`;
            csvContent += `Còn nợ,${reportData.unpaidCount}\n`;
            csvContent += `Tổng thu,${reportData.totalCollected?.toLocaleString()} VNĐ\n`;
            csvContent += `Tổng nợ,${reportData.totalDebt?.toLocaleString()} VNĐ\n`;
        }

        // Download
        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `bao-cao-${selectedReport}-${classData?.code || 'class'}-${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
        URL.revokeObjectURL(url);
    }, [reportData, selectedReport, classData]);

    // Reset & close
    const handleClose = () => {
        setSelectedReport('');
        setReportData(null);
        setError(null);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative w-full max-w-4xl max-h-[90vh] mx-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-zinc-800 bg-gradient-to-r from-cyan-500 to-blue-500 flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-white/20 rounded-lg">
                            <BarChart3 className="w-5 h-5 text-white" />
                        </div>
                        <div>
                            <h2 className="text-lg font-semibold text-white">
                                Báo cáo lớp học
                            </h2>
                            <p className="text-sm text-white/80">
                                {classData?.name}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                    >
                        <X className="w-5 h-5 text-white" />
                    </button>
                </div>

                {/* Content */}
                <div className="flex-1 overflow-y-auto p-4">
                    {!reportData ? (
                        /* Report Type Selection */
                        <div className="space-y-4">
                            <h3 className="font-medium text-slate-900 dark:text-slate-100">Chọn loại báo cáo</h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {REPORT_TYPES.map(report => {
                                    const Icon = report.icon;
                                    const isSelected = selectedReport === report.id;

                                    return (
                                        <button
                                            key={report.id}
                                            onClick={() => setSelectedReport(report.id)}
                                            className={`
                        flex items-start gap-4 p-4 rounded-xl border-2 transition-all text-left
                        ${isSelected
                                                    ? 'border-cyan-500 bg-cyan-50 dark:bg-cyan-950/20'
                                                    : 'border-slate-200 dark:border-zinc-800 hover:border-slate-300 dark:hover:border-zinc-700'
                                                }
                                                }`}
                                        >
                                            <div className={`
                        p-3 rounded-xl
                        ${isSelected ? 'bg-cyan-500' : 'bg-slate-100 dark:bg-zinc-800'}
                      `}>
                                                <Icon className={`w-6 h-6 ${isSelected ? 'text-white' : 'text-slate-500'}`} />
                                            </div>
                                            <div>
                                                <h4 className={`font-semibold ${isSelected ? 'text-cyan-900 dark:text-cyan-400' : 'text-slate-900 dark:text-slate-100'}`}>
                                                    {report.name}
                                                </h4>
                                                <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                                                    {report.description}
                                                </p>
                                            </div>
                                            {isSelected && (
                                                <CheckCircle className="w-5 h-5 text-cyan-500 ml-auto" />
                                            )}
                                        </button>
                                    );
                                })}
                            </div>

                            {error && (
                                <div className="p-4 bg-red-50 dark:bg-red-950/30 rounded-xl border border-red-200 dark:border-red-900/50">
                                    <div className="flex items-center gap-2 text-red-600">
                                        <AlertCircle className="w-5 h-5" />
                                        <span>{error}</span>
                                    </div>
                                </div>
                            )}
                        </div>
                    ) : (
                        /* Report Results */
                        <div className="space-y-6">
                            <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                                    {REPORT_TYPES.find(r => r.id === selectedReport)?.name}
                                </h3>
                                <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setReportData(null)}
                                >
                                    Chọn báo cáo khác
                                </Button>
                            </div>

                            {/* Attendance Report */}
                            {selectedReport === 'attendance' && (
                                <AttendanceReportView data={reportData} />
                            )}

                            {/* Progress Report */}
                            {selectedReport === 'progress' && (
                                <ProgressReportView data={reportData} />
                            )}

                            {/* Grades Report */}
                            {selectedReport === 'grades' && (
                                <GradesReportView data={reportData} />
                            )}

                            {/* Payment Report */}
                            {selectedReport === 'payment' && (
                                <PaymentReportView data={reportData} />
                            )}

                            {/* Summary Report */}
                            {selectedReport === 'summary' && (
                                <div className="space-y-6">
                                    <AttendanceReportView data={reportData.attendance} />
                                    <ProgressReportView data={reportData.progress} />
                                    <GradesReportView data={reportData.grades} />
                                    <PaymentReportView data={reportData.payment} />
                                </div>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-3 p-4 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex-shrink-0">
                    <Button variant="outline" onClick={handleClose}>
                        Đóng
                    </Button>

                    {!reportData ? (
                        <Button
                            onClick={generateReport}
                            disabled={!selectedReport || generating}
                            className="bg-cyan-600 hover:bg-cyan-700"
                        >
                            {generating ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Đang tạo...
                                </>
                            ) : (
                                <>
                                    <BarChart3 className="w-4 h-4 mr-2" />
                                    Tạo báo cáo
                                </>
                            )}
                        </Button>
                    ) : (
                        <Button
                            onClick={exportToCSV}
                            className="bg-cyan-600 hover:bg-cyan-700"
                        >
                            <Download className="w-4 h-4 mr-2" />
                            Xuất CSV
                        </Button>
                    )}
                </div>
            </div>
        </div>
    );
}

// Helper functions for generating reports
function generateAttendanceReport(sessions, students) {
    const completedSessions = sessions.filter(s => s.status === 'completed' || s.is_marked);

    // Calculate student stats
    const studentStats = students.map(student => {
        // In production, this would come from actual attendance data
        const presentCount = Math.floor(Math.random() * completedSessions.length * 0.9);
        const lateCount = Math.floor(Math.random() * 3);
        const absentCount = completedSessions.length - presentCount - lateCount;

        return {
            id: student.student_id || student.id,
            name: student.full_name,
            present: Math.max(0, presentCount),
            late: lateCount,
            absent: Math.max(0, absentCount),
            rate: completedSessions.length > 0
                ? Math.round((presentCount + lateCount) / completedSessions.length * 100)
                : 0
        };
    });

    const totalPresent = studentStats.reduce((sum, s) => sum + s.present, 0);
    const totalLate = studentStats.reduce((sum, s) => sum + s.late, 0);
    const totalAbsent = studentStats.reduce((sum, s) => sum + s.absent, 0);

    return {
        totalSessions: completedSessions.length,
        totalStudents: students.length,
        avgAttendanceRate: students.length > 0
            ? Math.round(studentStats.reduce((sum, s) => sum + s.rate, 0) / students.length)
            : 0,
        totalPresent,
        totalLate,
        totalAbsent,
        studentStats
    };
}

function generateProgressReport(classData, sessions) {
    const totalSessions = sessions.length;
    const completedSessions = sessions.filter(s => s.status === 'completed' || s.is_marked).length;
    const remainingSessions = totalSessions - completedSessions;
    const progressPercent = totalSessions > 0
        ? Math.round(completedSessions / totalSessions * 100)
        : 0;

    // Calculate estimated end date
    const scheduledSessionsPerWeek = classData?.schedule?.length || 3;
    const weeksRemaining = Math.ceil(remainingSessions / scheduledSessionsPerWeek);
    const estimatedEndDate = new Date();
    estimatedEndDate.setDate(estimatedEndDate.getDate() + weeksRemaining * 7);

    return {
        totalSessions,
        completedSessions,
        remainingSessions,
        progressPercent,
        startDate: classData?.start_date,
        expectedEndDate: classData?.end_date,
        estimatedEndDate: estimatedEndDate.toISOString().split('T')[0],
        status: classData?.status
    };
}

function generateGradesReport(students, grades) {
    // In production, this would calculate from actual grades data
    const studentGrades = students.map(student => {
        const average = Math.round(50 + Math.random() * 50); // Simulated
        return {
            id: student.student_id || student.id,
            name: student.full_name,
            average,
            rank: average >= 80 ? 'Giỏi' : average >= 65 ? 'Khá' : average >= 50 ? 'TB' : 'Yếu'
        };
    }).sort((a, b) => b.average - a.average);

    const classAverage = students.length > 0
        ? Math.round(studentGrades.reduce((sum, s) => sum + s.average, 0) / students.length)
        : 0;

    return {
        totalStudents: students.length,
        classAverage,
        highestScore: studentGrades[0]?.average || 0,
        lowestScore: studentGrades[studentGrades.length - 1]?.average || 0,
        excellentCount: studentGrades.filter(s => s.rank === 'Giỏi').length,
        goodCount: studentGrades.filter(s => s.rank === 'Khá').length,
        averageCount: studentGrades.filter(s => s.rank === 'TB').length,
        poorCount: studentGrades.filter(s => s.rank === 'Yếu').length,
        students: studentGrades
    };
}

function generatePaymentReport(students, classData) {
    const tuitionFee = classData?.course_price || 5000000; // Default fee

    // Calculate payment status
    const paidStudents = students.filter(s =>
        (s.total_paid || 0) >= tuitionFee || s.payment_status === 'paid'
    );
    const unpaidStudents = students.filter(s =>
        (s.total_paid || 0) < tuitionFee && s.payment_status !== 'paid'
    );

    const totalCollected = students.reduce((sum, s) => sum + (s.total_paid || 0), 0);
    const totalExpected = students.length * tuitionFee;
    const totalDebt = totalExpected - totalCollected;

    return {
        totalStudents: students.length,
        paidCount: paidStudents.length,
        unpaidCount: unpaidStudents.length,
        collectionRate: students.length > 0
            ? Math.round(paidStudents.length / students.length * 100)
            : 0,
        tuitionFee,
        totalCollected,
        totalExpected,
        totalDebt: Math.max(0, totalDebt)
    };
}

// Report View Components
function AttendanceReportView({ data }) {
    return (
        <div className="space-y-4">
            {/* Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Tổng buổi đã học"
                    value={data.totalSessions}
                    icon={Calendar}
                    color="blue"
                />
                <StatCard
                    label="Tỷ lệ TB"
                    value={`${data.avgAttendanceRate}%`}
                    icon={Percent}
                    color="green"
                />
                <StatCard
                    label="Tổng vắng"
                    value={data.totalAbsent}
                    icon={AlertCircle}
                    color="red"
                />
                <StatCard
                    label="Học viên"
                    value={data.totalStudents}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Student Table */}
            {data.studentStats?.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-zinc-800/50">
                            <tr>
                                <th className="text-left p-3 font-medium text-slate-700">Học viên</th>
                                <th className="text-center p-3 font-medium text-slate-700">Có mặt</th>
                                <th className="text-center p-3 font-medium text-slate-700">Trễ</th>
                                <th className="text-center p-3 font-medium text-slate-700">Vắng</th>
                                <th className="text-center p-3 font-medium text-slate-700">Tỷ lệ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.studentStats.map((student, idx) => (
                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50 dark:bg-zinc-800/50'}>
                                    <td className="p-3 font-medium text-slate-900">{student.name}</td>
                                    <td className="p-3 text-center text-emerald-600">{student.present}</td>
                                    <td className="p-3 text-center text-amber-600">{student.late}</td>
                                    <td className="p-3 text-center text-red-600">{student.absent}</td>
                                    <td className="p-3 text-center">
                                        <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${student.rate >= 80 ? 'bg-emerald-100 text-emerald-700' :
                                                student.rate >= 60 ? 'bg-amber-100 text-amber-700' :
                                                    'bg-red-100 text-red-700'}
                    `}>
                                            {student.rate}%
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function ProgressReportView({ data }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Tổng buổi"
                    value={data.totalSessions}
                    icon={Calendar}
                    color="blue"
                />
                <StatCard
                    label="Đã học"
                    value={data.completedSessions}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    label="Còn lại"
                    value={data.remainingSessions}
                    icon={Clock}
                    color="amber"
                />
                <StatCard
                    label="Tiến độ"
                    value={`${data.progressPercent}%`}
                    icon={TrendingUp}
                    color="purple"
                />
            </div>

            {/* Progress Bar */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiến độ khóa học</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{data.progressPercent}%</span>
                </div>
                <div className="w-full h-4 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all"
                        style={{ width: `${data.progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Ngày bắt đầu</span>
                    <p className="font-medium text-slate-900 dark:text-slate-100 mt-1">
                        {data.startDate ? new Date(data.startDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </p>
                </div>
                <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
                    <span className="text-xs text-slate-500 dark:text-slate-400">Dự kiến kết thúc</span>
                    <p className="font-medium text-slate-900 mt-1">
                        {data.estimatedEndDate ? new Date(data.estimatedEndDate).toLocaleDateString('vi-VN') : 'Chưa có'}
                    </p>
                </div>
            </div>
        </div>
    );
}

function GradesReportView({ data }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Điểm TB lớp"
                    value={data.classAverage}
                    icon={BarChart3}
                    color="blue"
                />
                <StatCard
                    label="Cao nhất"
                    value={data.highestScore}
                    icon={TrendingUp}
                    color="green"
                />
                <StatCard
                    label="Thấp nhất"
                    value={data.lowestScore}
                    icon={AlertCircle}
                    color="red"
                />
                <StatCard
                    label="Học viên"
                    value={data.totalStudents}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Grade Distribution */}
            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                <h4 className="font-medium text-slate-900 dark:text-slate-100 mb-3">Phân loại học lực</h4>
                <div className="grid grid-cols-4 gap-4">
                    <div className="text-center">
                        <div className="text-2xl font-bold text-emerald-600">{data.excellentCount}</div>
                        <div className="text-xs text-slate-500">Giỏi</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{data.goodCount}</div>
                        <div className="text-xs text-slate-500">Khá</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-amber-600">{data.averageCount}</div>
                        <div className="text-xs text-slate-500">TB</div>
                    </div>
                    <div className="text-center">
                        <div className="text-2xl font-bold text-red-600">{data.poorCount}</div>
                        <div className="text-xs text-slate-500">Yếu</div>
                    </div>
                </div>
            </div>

            {/* Student Rankings */}
            {data.students?.length > 0 && (
                <div className="border border-slate-200 dark:border-zinc-800 rounded-xl overflow-hidden bg-white dark:bg-zinc-900 shadow-sm">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 dark:bg-zinc-800/50">
                            <tr>
                                <th className="text-left p-3 font-medium text-slate-700">Hạng</th>
                                <th className="text-left p-3 font-medium text-slate-700">Học viên</th>
                                <th className="text-center p-3 font-medium text-slate-700">Điểm TB</th>
                                <th className="text-center p-3 font-medium text-slate-700">Xếp loại</th>
                            </tr>
                        </thead>
                        <tbody>
                            {data.students.slice(0, 10).map((student, idx) => (
                                <tr key={student.id} className={idx % 2 === 0 ? 'bg-white dark:bg-zinc-900' : 'bg-slate-50 dark:bg-zinc-800/50'}>
                                    <td className="p-3 font-medium text-slate-500">#{idx + 1}</td>
                                    <td className="p-3 font-medium text-slate-900">{student.name}</td>
                                    <td className="p-3 text-center font-semibold text-slate-900">{student.average}</td>
                                    <td className="p-3 text-center">
                                        <span className={`
                      px-2 py-1 rounded-full text-xs font-medium
                      ${student.rank === 'Giỏi' ? 'bg-emerald-100 text-emerald-700' :
                                                student.rank === 'Khá' ? 'bg-blue-100 text-blue-700' :
                                                    student.rank === 'TB' ? 'bg-amber-100 text-amber-700' :
                                                        'bg-red-100 text-red-700'}
                    `}>
                                            {student.rank}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

function PaymentReportView({ data }) {
    return (
        <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <StatCard
                    label="Đã đóng đủ"
                    value={data.paidCount}
                    icon={CheckCircle}
                    color="green"
                />
                <StatCard
                    label="Còn nợ"
                    value={data.unpaidCount}
                    icon={AlertCircle}
                    color="red"
                />
                <StatCard
                    label="Tỷ lệ thu"
                    value={`${data.collectionRate}%`}
                    icon={Percent}
                    color="blue"
                />
                <StatCard
                    label="Học viên"
                    value={data.totalStudents}
                    icon={Users}
                    color="purple"
                />
            </div>

            {/* Financial Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-emerald-50 dark:bg-emerald-950/20 rounded-xl border border-emerald-200 dark:border-emerald-800/50 shadow-sm">
                    <span className="text-xs text-emerald-600 dark:text-emerald-400">Đã thu</span>
                    <p className="text-xl font-bold text-emerald-700 mt-1">
                        {data.totalCollected?.toLocaleString()} đ
                    </p>
                </div>
                <div className="p-4 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800/50 shadow-sm">
                    <span className="text-xs text-blue-600 dark:text-blue-400">Dự kiến thu</span>
                    <p className="text-xl font-bold text-blue-700 mt-1">
                        {data.totalExpected?.toLocaleString()} đ
                    </p>
                </div>
                <div className="p-4 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800/50 shadow-sm">
                    <span className="text-xs text-red-600 dark:text-red-400">Công nợ</span>
                    <p className="text-xl font-bold text-red-700 mt-1">
                        {data.totalDebt?.toLocaleString()} đ
                    </p>
                </div>
            </div>

            <div className="p-4 bg-white dark:bg-zinc-900 border border-slate-200 dark:border-zinc-800 shadow-sm rounded-xl">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-slate-700 dark:text-slate-300">Tiến độ thu học phí</span>
                    <span className="text-sm text-slate-500 dark:text-slate-400">{data.collectionRate}%</span>
                </div>
                <div className="w-full h-4 bg-slate-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-gradient-to-r from-emerald-500 to-green-500 rounded-full transition-all"
                        style={{ width: `${data.collectionRate}%` }}
                    />
                </div>
            </div>
        </div>
    );
}

// Stat Card Component
function StatCard({ label, value, icon: Icon, color }) {
    const colorClasses = {
        blue: 'bg-blue-50 text-blue-600',
        green: 'bg-emerald-50 text-emerald-600',
        red: 'bg-red-50 text-red-600',
        amber: 'bg-amber-50 text-amber-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <div className="p-4 bg-white dark:bg-zinc-900 rounded-xl border border-slate-200 dark:border-zinc-800 shadow-sm">
            <div className={`w-10 h-10 rounded-lg ${colorClasses[color]} flex items-center justify-center mb-3`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-2xl font-bold text-slate-900">{value}</p>
            <p className="text-sm text-slate-500">{label}</p>
        </div>
    );
}

export default ClassReportModal;
