/**
 * StudentPerformanceTab Component
 * Tab view for student performance analytics in a class
 * Features:
 * - Overview summary with KPI cards
 * - Performance distribution charts
 * - Sortable student performance list  
 * - At-risk student alerts
 * - Export functionality
 */

import { useState, useMemo, useCallback, useEffect } from 'react';
import {
    Users,
    TrendingUp,
    TrendingDown,
    AlertTriangle,
    CheckCircle,
    Award,
    Target,
    Filter,
    Search,
    Download,
    RefreshCw,
    ChevronDown,
    ArrowUpDown,
    BarChart3,
    Loader2,
    X
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StudentPerformanceCard } from './StudentPerformanceCard';

// Sort options
const SORT_OPTIONS = [
    { value: 'rank', label: 'Xếp hạng' },
    { value: 'name', label: 'Tên A-Z' },
    { value: 'attendance', label: 'Điểm danh' },
    { value: 'grade', label: 'Điểm số' },
    { value: 'alerts', label: 'Cần chú ý' }
];

// Filter options
const FILTER_OPTIONS = [
    { value: 'all', label: 'Tất cả' },
    { value: 'excellent', label: 'Xuất sắc' },
    { value: 'good', label: 'Tốt' },
    { value: 'warning', label: 'Cần chú ý' },
    { value: 'danger', label: 'Cần hỗ trợ' }
];

// KPI Card component
function KPICard({ title, value, subValue, icon: Icon, color, trend }) {
    const colorClasses = {
        indigo: 'bg-indigo-50 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-400',
        green: 'bg-green-50 dark:bg-green-950/30 text-green-600 dark:text-green-400',
        amber: 'bg-amber-50 dark:bg-amber-950/30 text-amber-600 dark:text-amber-400',
        red: 'bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400',
        blue: 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 dark:text-blue-400'
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500 dark:text-slate-400">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subValue && (
                            <p className="text-xs text-slate-400 dark:text-slate-500 mt-1">{subValue}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
                {trend !== undefined && (
                    <div className="flex items-center gap-1 mt-2">
                        {trend >= 0 ? (
                            <TrendingUp className="w-4 h-4 text-green-500" />
                        ) : (
                            <TrendingDown className="w-4 h-4 text-red-500" />
                        )}
                        <span className={`text-sm font-medium ${trend >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                            {trend >= 0 ? '+' : ''}{trend}% vs tuần trước
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Distribution bar chart
function DistributionChart({ data }) {
    const maxValue = Math.max(...data.map(d => d.count));

    return (
        <div className="space-y-3">
            {data.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <div className="w-20 text-sm text-slate-600 dark:text-slate-400">{item.label}</div>
                    <div className="flex-1 h-6 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                        <div
                            className={`h-full rounded-full transition-all duration-500 ${item.color}`}
                            style={{ width: `${(item.count / maxValue) * 100}%` }}
                        />
                    </div>
                    <div className="w-16 text-right">
                        <span className="font-semibold text-slate-900 dark:text-slate-100">{item.count}</span>
                        <span className="text-xs text-slate-400 dark:text-slate-500 ml-1">({item.percent}%)</span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Alert card for at-risk students
function AtRiskCard({ students, onViewStudent }) {
    if (!students || students.length === 0) {
        return (
            <div className="text-center py-6 text-slate-500">
                <CheckCircle className="w-10 h-10 mx-auto mb-2 text-green-500" />
                <p className="font-medium">Tất cả học viên đang học tốt!</p>
                <p className="text-sm text-slate-400 dark:text-slate-500">Không có học viên nào cần hỗ trợ</p>
            </div>
        );
    }

    return (
        <div className="space-y-2 max-h-64 overflow-y-auto">
            {students.map((student, idx) => (
                <div
                    key={idx}
                    className="flex items-center justify-between p-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900 rounded-lg cursor-pointer hover:bg-red-100 dark:hover:bg-red-950/40 transition-colors"
                    onClick={() => onViewStudent?.(student)}
                >
                    <div className="flex items-center gap-3">
                        <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0" />
                        <div>
                            <p className="font-medium text-slate-900 dark:text-slate-100">{student.name}</p>
                            <p className="text-xs text-red-600 dark:text-red-400">{student.alertMessage}</p>
                        </div>
                    </div>
                    <div className="text-right">
                        <p className="text-sm font-medium text-slate-700 dark:text-slate-300">
                            {student.attendanceRate}% ĐD
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">
                            Điểm: {student.averageGrade?.toFixed(1) || '—'}
                        </p>
                    </div>
                </div>
            ))}
        </div>
    );
}

export function StudentPerformanceTab({
    classId,
    performanceData = [],
    loading = false,
    onRefresh,
    onViewStudentDetail
}) {
    const [searchTerm, setSearchTerm] = useState('');
    const [sortBy, setSortBy] = useState('rank');
    const [filterBy, setFilterBy] = useState('all');
    const [viewMode, setViewMode] = useState('cards'); // 'cards' | 'compact'

    // Calculate summary statistics
    const summary = useMemo(() => {
        if (!performanceData || performanceData.length === 0) {
            return {
                total: 0,
                avgAttendance: 0,
                avgGrade: 0,
                excellentCount: 0,
                atRiskCount: 0,
                distribution: []
            };
        }

        const total = performanceData.length;
        const avgAttendance = performanceData.reduce((sum, s) => sum + (s.attendanceRate || 0), 0) / total;
        const avgGrade = performanceData.reduce((sum, s) => sum + (s.averageGrade || 0), 0) / total;

        // Count by performance level
        const excellent = performanceData.filter(s => s.averageGrade >= 8).length;
        const good = performanceData.filter(s => s.averageGrade >= 6.5 && s.averageGrade < 8).length;
        const average = performanceData.filter(s => s.averageGrade >= 5 && s.averageGrade < 6.5).length;
        const poor = performanceData.filter(s => s.averageGrade < 5 || s.attendanceRate < 60).length;

        const distribution = [
            { label: 'Xuất sắc', count: excellent, percent: Math.round((excellent / total) * 100), color: 'bg-green-500' },
            { label: 'Khá', count: good, percent: Math.round((good / total) * 100), color: 'bg-blue-500' },
            { label: 'Trung bình', count: average, percent: Math.round((average / total) * 100), color: 'bg-amber-500' },
            { label: 'Yếu', count: poor, percent: Math.round((poor / total) * 100), color: 'bg-red-500' }
        ];

        return {
            total,
            avgAttendance: Math.round(avgAttendance),
            avgGrade: avgGrade.toFixed(1),
            excellentCount: excellent,
            atRiskCount: poor,
            distribution
        };
    }, [performanceData]);

    // Get at-risk students
    const atRiskStudents = useMemo(() => {
        return performanceData
            .filter(s => s.attendanceRate < 60 || (s.averageGrade !== null && s.averageGrade < 5))
            .map(s => ({
                ...s,
                alertMessage: s.attendanceRate < 60
                    ? `Điểm danh thấp (${s.attendanceRate}%)`
                    : `Điểm dưới trung bình (${s.averageGrade?.toFixed(1)})`
            }))
            .slice(0, 5);
    }, [performanceData]);

    // Filter and sort students
    const filteredStudents = useMemo(() => {
        let result = [...performanceData];

        // Apply search filter
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            result = result.filter(s =>
                s.name?.toLowerCase().includes(term) ||
                s.email?.toLowerCase().includes(term)
            );
        }

        // Apply performance filter
        if (filterBy !== 'all') {
            result = result.filter(s => {
                switch (filterBy) {
                    case 'excellent': return s.averageGrade >= 8;
                    case 'good': return s.averageGrade >= 6.5 && s.averageGrade < 8;
                    case 'warning': return s.averageGrade >= 5 && s.averageGrade < 6.5;
                    case 'danger': return s.averageGrade < 5 || s.attendanceRate < 60;
                    default: return true;
                }
            });
        }

        // Apply sorting
        result.sort((a, b) => {
            switch (sortBy) {
                case 'name': return (a.name || '').localeCompare(b.name || '');
                case 'attendance': return (b.attendanceRate || 0) - (a.attendanceRate || 0);
                case 'grade': return (b.averageGrade || 0) - (a.averageGrade || 0);
                case 'alerts': {
                    const alertsA = (a.attendanceRate < 80 ? 1 : 0) + (a.averageGrade < 5 ? 1 : 0);
                    const alertsB = (b.attendanceRate < 80 ? 1 : 0) + (b.averageGrade < 5 ? 1 : 0);
                    return alertsB - alertsA;
                }
                case 'rank':
                default: return (a.rank || 0) - (b.rank || 0);
            }
        });

        return result;
    }, [performanceData, searchTerm, sortBy, filterBy]);

    // Export handler
    const handleExport = useCallback(() => {
        const exportData = performanceData.map(s => ({
            'Tên': s.name,
            'Email': s.email,
            'Xếp hạng': s.rank,
            'Điểm danh (%)': s.attendanceRate,
            'Điểm TB': s.averageGrade?.toFixed(1) || '',
            'Xu hướng': s.trend === 'improving' ? 'Tiến bộ' : s.trend === 'declining' ? 'Giảm' : 'Ổn định',
            'Trạng thái': s.averageGrade >= 8 ? 'Xuất sắc' : s.averageGrade >= 6.5 ? 'Khá' : s.averageGrade >= 5 ? 'TB' : 'Yếu'
        }));

        const csv = [
            Object.keys(exportData[0] || {}).join(','),
            ...exportData.map(row => Object.values(row).join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8;' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `performance_report_${new Date().toISOString().split('T')[0]}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }, [performanceData]);

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Đang tải dữ liệu performance...</p>
                </div>
            </div>
        );
    }

    if (!performanceData || performanceData.length === 0) {
        return (
            <div className="text-center py-16">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 dark:text-slate-400 font-medium">Chưa có dữ liệu performance</p>
                <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">
                    Cần có học viên trong lớp để xem phân tích
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Phân tích Performance</h3>
                    <p className="text-sm text-slate-500 dark:text-slate-400">
                        Theo dõi tiến độ học tập của {summary.total} học viên
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" size="sm" onClick={onRefresh}>
                        <RefreshCw className="w-4 h-4 mr-1" />
                        Làm mới
                    </Button>
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-1" />
                        Xuất Excel
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                <KPICard
                    title="Tổng học viên"
                    value={summary.total}
                    icon={Users}
                    color="indigo"
                />
                <KPICard
                    title="Điểm danh TB"
                    value={`${summary.avgAttendance}%`}
                    subValue="Trung bình lớp"
                    icon={Target}
                    color={summary.avgAttendance >= 80 ? 'green' : 'amber'}
                />
                <KPICard
                    title="Điểm TB"
                    value={summary.avgGrade}
                    subValue="Trung bình lớp"
                    icon={Award}
                    color={parseFloat(summary.avgGrade) >= 6.5 ? 'green' : 'amber'}
                />
                <KPICard
                    title="Cần hỗ trợ"
                    value={summary.atRiskCount}
                    subValue={`${summary.excellentCount} xuất sắc`}
                    icon={AlertTriangle}
                    color={summary.atRiskCount > 0 ? 'red' : 'green'}
                />
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Distribution Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base">Phân bố học lực</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DistributionChart data={summary.distribution} />
                    </CardContent>
                </Card>

                {/* At-Risk Students */}
                <Card className="border-red-100 dark:border-red-900">
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Học viên cần hỗ trợ ({atRiskStudents.length})
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <AtRiskCard
                            students={atRiskStudents}
                            onViewStudent={onViewStudentDetail}
                        />
                    </CardContent>
                </Card>
            </div>

            {/* Filter Bar */}
            <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 p-4 bg-white dark:bg-zinc-900 shadow-md border border-slate-200 dark:border-zinc-800 rounded-xl">
                {/* Search */}
                <div className="relative w-full lg:w-72">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <Input
                        type="text"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        placeholder="Tìm học viên..."
                        className="pl-10 bg-white dark:bg-zinc-800 border-slate-200 dark:border-zinc-700"
                    />
                    {searchTerm && (
                        <button
                            onClick={() => setSearchTerm('')}
                            className="absolute right-3 top-1/2 -translate-y-1/2"
                        >
                            <X className="w-4 h-4 text-slate-400" />
                        </button>
                    )}
                </div>

                <div className="flex items-center gap-3">
                    {/* Filter */}
                    <select
                        value={filterBy}
                        onChange={(e) => setFilterBy(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-slate-200 text-sm"
                    >
                        {FILTER_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {/* Sort */}
                    <select
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="h-10 px-3 rounded-lg border border-slate-200 dark:border-zinc-700 bg-white dark:bg-zinc-800 dark:text-slate-200 text-sm"
                    >
                        {SORT_OPTIONS.map(opt => (
                            <option key={opt.value} value={opt.value}>{opt.label}</option>
                        ))}
                    </select>

                    {/* View Mode Toggle */}
                    <div className="flex items-center border border-slate-200 dark:border-zinc-700 rounded-lg overflow-hidden">
                        <button
                            onClick={() => setViewMode('cards')}
                            className={`p-2 ${viewMode === 'cards' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-slate-500'}`}
                        >
                            <BarChart3 className="w-5 h-5" />
                        </button>
                        <button
                            onClick={() => setViewMode('compact')}
                            className={`p-2 ${viewMode === 'compact' ? 'bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 dark:text-indigo-400' : 'bg-white dark:bg-zinc-800 text-slate-400 dark:text-slate-500'}`}
                        >
                            <Users className="w-5 h-5" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Results count */}
            <p className="text-sm text-slate-500 dark:text-slate-400">
                Hiển thị {filteredStudents.length} / {performanceData.length} học viên
            </p>

            {/* Student List */}
            <div className={viewMode === 'cards'
                ? 'grid grid-cols-1 lg:grid-cols-2 gap-4'
                : 'space-y-2'
            }>
                {filteredStudents.map((student, idx) => (
                    <StudentPerformanceCard
                        key={student.studentId || idx}
                        student={{
                            id: student.studentId,
                            name: student.name,
                            email: student.email,
                            avatarUrl: student.avatarUrl
                        }}
                        performance={student}
                        rank={student.rank || idx + 1}
                        totalStudents={summary.total}
                        onViewDetail={onViewStudentDetail}
                        compact={viewMode === 'compact'}
                    />
                ))}
            </div>

            {filteredStudents.length === 0 && (
                <div className="text-center py-12 bg-white dark:bg-zinc-900 shadow-md border border-slate-200 dark:border-zinc-800 rounded-xl">
                    <Search className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                    <p className="text-slate-600 dark:text-slate-400 font-medium">Không tìm thấy học viên</p>
                    <p className="text-sm text-slate-400 dark:text-slate-500 mt-1">Thử thay đổi bộ lọc hoặc từ khóa tìm kiếm</p>
                    <Button
                        variant="outline"
                        className="mt-4"
                        onClick={() => { setSearchTerm(''); setFilterBy('all'); }}
                    >
                        <X className="w-4 h-4 mr-2" />
                        Xóa bộ lọc
                    </Button>
                </div>
            )}
        </div>
    );
}

export default StudentPerformanceTab;
