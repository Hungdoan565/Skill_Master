import { gooeyToast } from 'goey-toast';
/**
 * Courses Report Page - Báo cáo hiệu suất khóa học
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    BookOpen,
    Users,
    DollarSign,
    TrendingUp,
    RefreshCw,
    Filter,
    Save
} from 'lucide-react';
import {
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports } from '../hooks/useReports';
import { SaveReportModal } from '../components';
import { formatNumber, formatCurrency, CHART_COLORS, exportReportToExcel } from '../utils';

export default function CoursesReportPage() {
    const { fetchCoursesReport, saveReport, loading, error } = useReports();
    const [data, setData] = useState(null);
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadReport();
    }, []);

    const loadReport = async () => {
        const result = await fetchCoursesReport({});
        if (result) {
            setData(result);
        }
    };

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportReportToExcel('courses', data);
        } catch (err) {
            console.error('Export error:', err);
            gooeyToast('Lỗi khi xuất Excel: ' + err.message);
        } finally {
            setExporting(false);
        }
    };

    const handleSaveReport = () => {
        setShowSaveModal(true);
    };

    const onSaveReport = async (reportData) => {
        setSavingReport(true);
        try {
            const result = await saveReport(reportData);
            setSavingReport(false);
            return result;
        } catch (err) {
            setSavingReport(false);
            throw err;
        }
    };

    if (loading && !data) {
        return (
            <div className="p-6 flex items-center justify-center min-h-[400px]">
                <div className="text-center">
                    <RefreshCw className="h-8 w-8 animate-spin mx-auto text-blue-600" />
                    <p className="mt-2 text-gray-500">Đang tải báo cáo...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/reports">
                        <Button variant="ghost" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Khóa học</h1>
                        <p className="text-gray-500">Phân tích hiệu suất các khóa học</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveReport}>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu báo cáo
                    </Button>
                    <Button onClick={handleExport} disabled={exporting || !data}>
                        {exporting ? (
                            <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        ) : (
                            <Download className="h-4 w-4 mr-2" />
                        )}
                        {exporting ? 'Đang xuất...' : 'Xuất Excel'}
                    </Button>
                </div>
            </div>

            {/* Filters */}
            <Card>
                <CardHeader className="pb-3">
                    <CardTitle className="text-base flex items-center gap-2">
                        <Filter className="h-4 w-4" />
                        Bộ lọc
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex flex-wrap gap-4">
                        <div className="flex items-end">
                            <Button onClick={loadReport} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            )}

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng khóa học</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(data.summary.totalCourses)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng lớp học</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {formatNumber(data.summary.totalClasses)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <Users className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng học viên</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatNumber(data.summary.totalEnrollments)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng doanh thu</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {formatCurrency(data.summary.totalRevenue)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Top by Revenue */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 5 theo doanh thu</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.topByRevenue} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis
                                            type="number"
                                            tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                        />
                                        <YAxis dataKey="title" type="category" width={120} />
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                        <Bar dataKey="totalRevenue" fill="#22c55e" radius={[0, 4, 4, 0]} name="Doanh thu" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Top by Enrollments */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Top 5 theo học viên</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.topByEnrollments} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="title" type="category" width={120} />
                                        <Tooltip />
                                        <Bar dataKey="totalEnrollments" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Số học viên" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Category */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Thống kê theo danh mục</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.byCategory}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="name" />
                                    <YAxis yAxisId="left" />
                                    <YAxis
                                        yAxisId="right"
                                        orientation="right"
                                        tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                    />
                                    <Tooltip
                                        formatter={(val, name) => {
                                            if (name === 'Doanh thu') return formatCurrency(val);
                                            return val;
                                        }}
                                    />
                                    <Legend />
                                    <Bar yAxisId="left" dataKey="courses" fill="#3b82f6" name="Khóa học" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="left" dataKey="enrollments" fill="#22c55e" name="Học viên" radius={[4, 4, 0, 0]} />
                                    <Bar yAxisId="right" dataKey="revenue" fill="#f59e0b" name="Doanh thu" radius={[4, 4, 0, 0]} />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Course Details Table */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Chi tiết từng khóa học</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-gray-500">
                                            <th className="pb-3 font-medium">Mã</th>
                                            <th className="pb-3 font-medium">Tên khóa học</th>
                                            <th className="pb-3 font-medium">Danh mục</th>
                                            <th className="pb-3 font-medium text-center">Lớp</th>
                                            <th className="pb-3 font-medium text-center">Học viên</th>
                                            <th className="pb-3 font-medium text-center">TB/Lớp</th>
                                            <th className="pb-3 font-medium text-right">Doanh thu</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.courseStats.map((course) => (
                                            <tr key={course.id} className="text-sm">
                                                <td className="py-3 font-mono text-blue-600">{course.code}</td>
                                                <td className="py-3 font-medium">{course.title}</td>
                                                <td className="py-3">
                                                    <span className="px-2 py-1 bg-gray-100 rounded text-xs">
                                                        {course.category}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className="text-green-600">{course.ongoingClasses}</span>
                                                    <span className="text-gray-400"> / </span>
                                                    <span>{course.totalClasses}</span>
                                                </td>
                                                <td className="py-3 text-center">{course.totalEnrollments}</td>
                                                <td className="py-3 text-center text-gray-500">{course.avgEnrollmentsPerClass}</td>
                                                <td className="py-3 text-right font-medium text-green-600">
                                                    {formatCurrency(course.totalRevenue)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>
                </>
            )}

            {/* Save Report Modal */}
            <SaveReportModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={onSaveReport}
                reportType="courses"
                filters={{}}
                saving={savingReport}
            />
        </div>
    );
}
