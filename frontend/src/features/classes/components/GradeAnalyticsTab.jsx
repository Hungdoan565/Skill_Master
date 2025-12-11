/**
 * GradeAnalyticsTab Component
 * Visual analytics for grade data in a class
 * Features:
 * - Grade distribution histogram
 * - Component breakdown comparison
 * - Top performers list
 * - Class statistics summary
 */

import { useState, useMemo } from 'react';
import {
    BarChart3,
    TrendingUp,
    Award,
    Users,
    Target,
    AlertTriangle,
    CheckCircle,
    Download,
    RefreshCw,
    ChevronDown,
    Loader2,
    GraduationCap,
    Medal,
    PieChart
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    PieChart as RePieChart,
    Pie,
    Cell,
    Legend,
    RadarChart,
    PolarGrid,
    PolarAngleAxis,
    PolarRadiusAxis,
    Radar
} from 'recharts';

// Color palette
const COLORS = {
    excellent: '#10b981', // green-500
    good: '#3b82f6',      // blue-500
    average: '#f59e0b',   // amber-500
    poor: '#ef4444',      // red-500
    noGrade: '#94a3b8'    // slate-400
};

const DISTRIBUTION_COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#94a3b8'];

// KPI Card component
function KPICard({ title, value, subValue, icon: Icon, color, trend }) {
    const colorClasses = {
        green: 'bg-green-50 text-green-600',
        blue: 'bg-blue-50 text-blue-600',
        amber: 'bg-amber-50 text-amber-600',
        red: 'bg-red-50 text-red-600',
        indigo: 'bg-indigo-50 text-indigo-600',
        purple: 'bg-purple-50 text-purple-600'
    };

    return (
        <Card>
            <CardContent className="p-4">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm text-slate-500">{title}</p>
                        <p className="text-2xl font-bold mt-1">{value}</p>
                        {subValue && (
                            <p className="text-xs text-slate-400 mt-1">{subValue}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${colorClasses[color]}`}>
                        <Icon className="w-5 h-5" />
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}

// Distribution Bar
function DistributionBar({ data }) {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    if (total === 0) return null;

    return (
        <div className="space-y-2">
            {data.map((item, idx) => (
                <div key={idx} className="flex items-center gap-3">
                    <div className="w-24 text-sm text-slate-600 truncate">{item.label}</div>
                    <div className="flex-1 h-6 bg-slate-100 rounded-full overflow-hidden">
                        <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                                width: `${(item.count / total) * 100}%`,
                                backgroundColor: item.color
                            }}
                        />
                    </div>
                    <div className="w-20 text-right">
                        <span className="font-semibold text-slate-900">{item.count}</span>
                        <span className="text-xs text-slate-400 ml-1">
                            ({Math.round((item.count / total) * 100)}%)
                        </span>
                    </div>
                </div>
            ))}
        </div>
    );
}

// Top Performer Card
function TopPerformerCard({ student, rank, totalStudents }) {
    const rankColors = {
        1: 'bg-amber-100 text-amber-700 border-amber-300',
        2: 'bg-slate-100 text-slate-700 border-slate-300',
        3: 'bg-orange-100 text-orange-700 border-orange-300'
    };

    const medals = {
        1: '🥇',
        2: '🥈',
        3: '🥉'
    };

    return (
        <div className={`flex items-center justify-between p-3 rounded-lg border ${rankColors[rank] || 'bg-white border-slate-200'}`}>
            <div className="flex items-center gap-3">
                <span className="text-2xl">{medals[rank] || `#${rank}`}</span>
                <div>
                    <p className="font-medium text-slate-900">{student.name}</p>
                    <p className="text-xs text-slate-500">{student.email}</p>
                </div>
            </div>
            <div className="text-right">
                <p className="text-lg font-bold text-indigo-600">{student.average?.toFixed(1)}</p>
                <p className="text-xs text-slate-400">Điểm TB</p>
            </div>
        </div>
    );
}

// Custom tooltip for charts
const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white px-3 py-2 rounded-lg shadow-lg border border-slate-200">
                <p className="text-sm font-medium text-slate-900">{label}</p>
                <p className="text-sm text-indigo-600">
                    {payload[0].value} học viên
                </p>
            </div>
        );
    }
    return null;
};

export function GradeAnalyticsTab({
    gradeStructures = [],
    gradeMatrix = [],
    loading = false,
    onRefresh
}) {
    const [selectedChart, setSelectedChart] = useState('distribution');

    // Calculate all analytics data
    const analytics = useMemo(() => {
        if (!gradeMatrix || gradeMatrix.length === 0 || !gradeStructures || gradeStructures.length === 0) {
            return null;
        }

        const students = gradeMatrix.map(student => {
            // Calculate weighted average for each student
            let totalWeight = 0;
            let weightedSum = 0;
            const grades = {};

            gradeStructures.forEach(structure => {
                // Fix: Read from student.grades[structure.id].score
                const score = student.grades?.[structure.id]?.score;
                grades[structure.id] = score;

                if (score !== null && score !== undefined && score !== '') {
                    const numScore = parseFloat(score);
                    if (!isNaN(numScore)) {
                        const normalizedScore = (numScore / structure.max_score) * 10;
                        weightedSum += normalizedScore * structure.weight;
                        totalWeight += structure.weight;
                    }
                }
            });

            const average = totalWeight > 0 ? weightedSum / totalWeight : null;

            return {
                enrollmentId: student.enrollment_id,
                name: student.student_name,
                email: student.student_email,
                grades,
                average,
                hasGrades: totalWeight > 0
            };
        });

        // Statistics
        const studentsWithGrades = students.filter(s => s.hasGrades);
        const totalStudents = students.length;
        const gradedCount = studentsWithGrades.length;
        const ungradedCount = totalStudents - gradedCount;

        // Grade distribution
        const excellent = studentsWithGrades.filter(s => s.average >= 8).length;
        const good = studentsWithGrades.filter(s => s.average >= 6.5 && s.average < 8).length;
        const average = studentsWithGrades.filter(s => s.average >= 5 && s.average < 6.5).length;
        const poor = studentsWithGrades.filter(s => s.average < 5).length;

        const distribution = [
            { label: 'Xuất sắc (≥8)', count: excellent, color: COLORS.excellent },
            { label: 'Khá (6.5-8)', count: good, color: COLORS.good },
            { label: 'Trung bình (5-6.5)', count: average, color: COLORS.average },
            { label: 'Yếu (<5)', count: poor, color: COLORS.poor },
            { label: 'Chưa có điểm', count: ungradedCount, color: COLORS.noGrade }
        ];

        // Histogram data (grade ranges)
        const histogramData = [
            { range: '0-2', count: studentsWithGrades.filter(s => s.average < 2).length },
            { range: '2-4', count: studentsWithGrades.filter(s => s.average >= 2 && s.average < 4).length },
            { range: '4-5', count: studentsWithGrades.filter(s => s.average >= 4 && s.average < 5).length },
            { range: '5-6', count: studentsWithGrades.filter(s => s.average >= 5 && s.average < 6).length },
            { range: '6-7', count: studentsWithGrades.filter(s => s.average >= 6 && s.average < 7).length },
            { range: '7-8', count: studentsWithGrades.filter(s => s.average >= 7 && s.average < 8).length },
            { range: '8-9', count: studentsWithGrades.filter(s => s.average >= 8 && s.average < 9).length },
            { range: '9-10', count: studentsWithGrades.filter(s => s.average >= 9).length }
        ];

        // Component averages
        const componentData = gradeStructures.map(structure => {
            const scores = students
                .map(s => s.grades[structure.id])
                .filter(score => score !== null && score !== undefined && score !== '')
                .map(score => parseFloat(score))
                .filter(score => !isNaN(score));

            const avgScore = scores.length > 0
                ? scores.reduce((sum, s) => sum + s, 0) / scores.length
                : 0;

            // Normalize to 10-point scale
            const normalizedAvg = (avgScore / structure.max_score) * 10;

            return {
                name: structure.name,
                average: Math.round(normalizedAvg * 10) / 10,
                weight: Math.round(structure.weight * 100),
                maxScore: structure.max_score,
                gradedCount: scores.length,
                rawAverage: Math.round(avgScore * 10) / 10
            };
        });

        // Top performers
        const topPerformers = [...studentsWithGrades]
            .sort((a, b) => (b.average || 0) - (a.average || 0))
            .slice(0, 5);

        // At-risk students (failing)
        const atRiskStudents = studentsWithGrades
            .filter(s => s.average < 5)
            .sort((a, b) => (a.average || 0) - (b.average || 0))
            .slice(0, 5);

        // Overall stats
        const overallAverage = studentsWithGrades.length > 0
            ? studentsWithGrades.reduce((sum, s) => sum + (s.average || 0), 0) / studentsWithGrades.length
            : 0;

        const passRate = studentsWithGrades.length > 0
            ? Math.round((studentsWithGrades.filter(s => s.average >= 5).length / studentsWithGrades.length) * 100)
            : 0;

        const highestScore = Math.max(...studentsWithGrades.map(s => s.average || 0), 0);
        const lowestScore = studentsWithGrades.length > 0
            ? Math.min(...studentsWithGrades.map(s => s.average || 0))
            : 0;

        return {
            totalStudents,
            gradedCount,
            ungradedCount,
            overallAverage: Math.round(overallAverage * 10) / 10,
            passRate,
            highestScore: Math.round(highestScore * 10) / 10,
            lowestScore: Math.round(lowestScore * 10) / 10,
            distribution,
            histogramData,
            componentData,
            topPerformers,
            atRiskStudents,
            excellent,
            good,
            average: average,
            poor
        };
    }, [gradeMatrix, gradeStructures]);

    // Export function
    const handleExport = () => {
        if (!analytics) return;

        const reportData = {
            summary: {
                totalStudents: analytics.totalStudents,
                gradedCount: analytics.gradedCount,
                overallAverage: analytics.overallAverage,
                passRate: analytics.passRate
            },
            distribution: analytics.distribution,
            components: analytics.componentData,
            topPerformers: analytics.topPerformers.map((s, i) => ({
                rank: i + 1,
                name: s.name,
                average: s.average?.toFixed(1)
            }))
        };

        const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: 'application/json' });
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `grade_analytics_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center py-16">
                <div className="text-center">
                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Đang phân tích điểm số...</p>
                </div>
            </div>
        );
    }

    if (!analytics) {
        return (
            <div className="text-center py-16">
                <BarChart3 className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <p className="text-slate-600 font-medium">Chưa có dữ liệu điểm</p>
                <p className="text-sm text-slate-400 mt-1">
                    Cần có cấu trúc điểm và học viên để xem phân tích
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="text-lg font-semibold text-slate-900">Phân tích điểm số</h3>
                    <p className="text-sm text-slate-500">
                        {analytics.gradedCount}/{analytics.totalStudents} học viên đã có điểm
                    </p>
                </div>
                <div className="flex items-center gap-2">
                    {onRefresh && (
                        <Button variant="outline" size="sm" onClick={onRefresh}>
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Làm mới
                        </Button>
                    )}
                    <Button variant="outline" size="sm" onClick={handleExport}>
                        <Download className="w-4 h-4 mr-2" />
                        Xuất báo cáo
                    </Button>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <KPICard
                    title="Điểm trung bình"
                    value={analytics.overallAverage.toFixed(1)}
                    subValue="Thang điểm 10"
                    icon={Target}
                    color="indigo"
                />
                <KPICard
                    title="Tỷ lệ đạt"
                    value={`${analytics.passRate}%`}
                    subValue={`${analytics.gradedCount - analytics.poor}/${analytics.gradedCount} đạt`}
                    icon={CheckCircle}
                    color="green"
                />
                <KPICard
                    title="Điểm cao nhất"
                    value={analytics.highestScore.toFixed(1)}
                    icon={Award}
                    color="amber"
                />
                <KPICard
                    title="Cần hỗ trợ"
                    value={analytics.poor}
                    subValue="Học viên dưới TB"
                    icon={AlertTriangle}
                    color="red"
                />
            </div>

            {/* Charts Section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Grade Distribution Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <BarChart3 className="w-5 h-5 text-indigo-600" />
                            Phân bố điểm số
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={analytics.histogramData}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                                    <YAxis tick={{ fontSize: 12 }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    <Bar
                                        dataKey="count"
                                        fill="#6366f1"
                                        radius={[4, 4, 0, 0]}
                                    />
                                </BarChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Performance Level Pie Chart */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <PieChart className="w-5 h-5 text-indigo-600" />
                            Tỷ lệ xếp loại
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="h-64">
                            <ResponsiveContainer width="100%" height="100%">
                                <RePieChart>
                                    <Pie
                                        data={analytics.distribution.filter(d => d.count > 0)}
                                        cx="50%"
                                        cy="50%"
                                        labelLine={false}
                                        label={({ name, percent }) => `${Math.round(percent * 100)}%`}
                                        outerRadius={80}
                                        fill="#8884d8"
                                        dataKey="count"
                                        nameKey="label"
                                    >
                                        {analytics.distribution.filter(d => d.count > 0).map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Legend
                                        formatter={(value, entry) => (
                                            <span className="text-sm text-slate-600">{value}</span>
                                        )}
                                    />
                                    <Tooltip />
                                </RePieChart>
                            </ResponsiveContainer>
                        </div>
                    </CardContent>
                </Card>

                {/* Component Comparison */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <GraduationCap className="w-5 h-5 text-indigo-600" />
                            So sánh theo cột điểm
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {analytics.componentData.map((comp, idx) => (
                                <div key={idx} className="space-y-1">
                                    <div className="flex items-center justify-between text-sm">
                                        <span className="text-slate-700 font-medium">{comp.name}</span>
                                        <span className="text-slate-500">
                                            TB: <span className="font-semibold text-indigo-600">{comp.average}</span>/10
                                            ({comp.gradedCount} đã chấm)
                                        </span>
                                    </div>
                                    <div className="h-3 bg-slate-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full rounded-full transition-all duration-500"
                                            style={{
                                                width: `${(comp.average / 10) * 100}%`,
                                                backgroundColor: comp.average >= 8 ? COLORS.excellent :
                                                    comp.average >= 6.5 ? COLORS.good :
                                                        comp.average >= 5 ? COLORS.average : COLORS.poor
                                            }}
                                        />
                                    </div>
                                    <p className="text-xs text-slate-400">
                                        Trọng số: {comp.weight}% • Điểm tối đa: {comp.maxScore}
                                    </p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Distribution Summary */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Users className="w-5 h-5 text-indigo-600" />
                            Phân loại học viên
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <DistributionBar data={analytics.distribution} />
                    </CardContent>
                </Card>
            </div>

            {/* Top Performers & At-Risk */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Top Performers */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <Medal className="w-5 h-5 text-amber-500" />
                            Top học viên xuất sắc
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.topPerformers.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.topPerformers.map((student, idx) => (
                                    <TopPerformerCard
                                        key={student.enrollmentId}
                                        student={student}
                                        rank={idx + 1}
                                        totalStudents={analytics.totalStudents}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-slate-500">
                                <Award className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                                <p>Chưa có dữ liệu điểm</p>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* At-Risk Students */}
                <Card>
                    <CardHeader className="pb-2">
                        <CardTitle className="text-base flex items-center gap-2">
                            <AlertTriangle className="w-5 h-5 text-red-500" />
                            Học viên cần hỗ trợ
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        {analytics.atRiskStudents.length > 0 ? (
                            <div className="space-y-2">
                                {analytics.atRiskStudents.map((student) => (
                                    <div
                                        key={student.enrollmentId}
                                        className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-lg"
                                    >
                                        <div>
                                            <p className="font-medium text-slate-900">{student.name}</p>
                                            <p className="text-xs text-red-600">Điểm dưới trung bình</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-lg font-bold text-red-600">
                                                {student.average?.toFixed(1)}
                                            </p>
                                            <p className="text-xs text-slate-400">Điểm TB</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-8 text-green-600">
                                <CheckCircle className="w-10 h-10 mx-auto mb-2" />
                                <p className="font-medium">Tất cả học viên đạt yêu cầu!</p>
                                <p className="text-sm text-slate-400">Không có học viên dưới trung bình</p>
                            </div>
                        )}
                    </CardContent>
                </Card>
            </div>

            {/* Summary Stats */}
            <Card className="bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-100">
                <CardContent className="p-6">
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center">
                        <div>
                            <p className="text-3xl font-bold text-indigo-600">{analytics.totalStudents}</p>
                            <p className="text-sm text-slate-600">Tổng học viên</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-green-600">{analytics.excellent}</p>
                            <p className="text-sm text-slate-600">Xuất sắc (≥8)</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-blue-600">{analytics.good}</p>
                            <p className="text-sm text-slate-600">Khá (6.5-8)</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-amber-600">{analytics.average}</p>
                            <p className="text-sm text-slate-600">Trung bình</p>
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-red-600">{analytics.poor}</p>
                            <p className="text-sm text-slate-600">Cần hỗ trợ</p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}

export default GradeAnalyticsTab;
