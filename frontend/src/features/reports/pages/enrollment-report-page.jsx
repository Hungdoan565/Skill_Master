import { gooeyToast } from 'goey-toast';
/**
 * Enrollment Report Page - Báo cáo tuyển sinh
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    TrendingUp,
    TrendingDown,
    Users,
    UserPlus,
    UserMinus,
    RefreshCw,
    Filter,
    Save
} from 'lucide-react';
import {
    AreaChart,
    Area,
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useReports } from '../hooks/useReports';
import { SaveReportModal } from '../components';
import CrossCenterToggle from '../components/CrossCenterToggle';
import {
    formatNumber,
    formatPercent,
    DATE_PRESETS,
    getDateRangeFromPreset,
    CHART_COLORS,
    exportReportToExcel
} from '../utils';

const STATUS_LABELS = {
    active: 'Đang học',
    completed: 'Hoàn thành',
    dropped: 'Nghỉ học',
    transferred: 'Chuyển lớp'
};

const STATUS_COLORS = {
    active: '#22c55e',
    completed: '#3b82f6',
    dropped: '#ef4444',
    transferred: '#f59e0b'
};

export default function EnrollmentReportPage() {
    const { fetchEnrollmentReport, saveReport, loading, error } = useReports();

    const [isSystemWide, setIsSystemWide] = useState(false);
    const [data, setData] = useState(null);
    const [datePreset, setDatePreset] = useState('30days');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [exporting, setExporting] = useState(false);

    const loadReport = useCallback(async () => {
        let startDate, endDate;

        if (datePreset === 'custom' && customDates.start && customDates.end) {
            if (customDates.start > customDates.end) {
                gooeyToast('Ngày bắt đầu phải trước ngày kết thúc');
                return;
            }
            startDate = customDates.start;
            endDate = customDates.end;
        } else {
            const range = getDateRangeFromPreset(datePreset);
            startDate = range.start;
            endDate = range.end;
        }

        const result = await fetchEnrollmentReport({ startDate, endDate, system_wide: isSystemWide });
        if (result) {
            setData(result);
        }
    }, [datePreset, customDates, isSystemWide, fetchEnrollmentReport]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportReportToExcel('enrollment', data, data.period);
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
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Tuyển sinh</h1>
                        <p className="text-gray-500">
                            {data?.period?.startDate} - {data?.period?.endDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CrossCenterToggle value={isSystemWide} onChange={setIsSystemWide} />
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
                        <div>
                            <Label className="text-xs text-gray-500">Khoảng thời gian</Label>
                            <select
                                value={datePreset}
                                onChange={(e) => setDatePreset(e.target.value)}
                                className="mt-1 block w-40 rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                                {DATE_PRESETS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {datePreset === 'custom' && (
                            <>
                                <div>
                                    <Label className="text-xs text-gray-500">Từ ngày</Label>
                                    <Input
                                        type="date"
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                        className="mt-1 w-40"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-gray-500">Đến ngày</Label>
                                    <Input
                                        type="date"
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                        className="mt-1 w-40"
                                    />
                                </div>
                            </>
                        )}

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
                                        <p className="text-sm text-gray-500">Tổng ghi danh</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(data.summary.totalEnrollments)}
                                        </p>
                                        <div className={`flex items-center gap-1 text-sm mt-1 ${data.summary.growthPercent >= 0 ? 'text-green-600' : 'text-red-600'
                                            }`}>
                                            {data.summary.growthPercent >= 0 ? (
                                                <TrendingUp className="h-4 w-4" />
                                            ) : (
                                                <TrendingDown className="h-4 w-4" />
                                            )}
                                            <span>{formatPercent(Math.abs(data.summary.growthPercent), 0)} so với kỳ trước</span>
                                        </div>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Users className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Đang học</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatNumber(data.summary.activeEnrollments)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <UserPlus className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Nghỉ học</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {formatNumber(data.summary.droppedEnrollments)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <UserMinus className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tỷ lệ nghỉ</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {formatPercent(data.summary.dropRate, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg">
                                        <TrendingDown className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Enrollment Trend */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Xu hướng ghi danh</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(data.chartData || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.chartData}>
                                            <defs>
                                                <linearGradient id="colorEnroll" x1="0" y1="0" x2="0" y2="1">
                                                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                                                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                                </linearGradient>
                                            </defs>
                                            <CartesianGrid strokeDasharray="3 3" />
                                            <XAxis
                                                dataKey="date"
                                                tickFormatter={(val) => {
                                                    const d = new Date(val);
                                                    return `${d.getDate()}/${d.getMonth() + 1}`;
                                                }}
                                            />
                                            <YAxis />
                                            <Tooltip
                                                labelFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="count"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="url(#colorEnroll)"
                                                name="Ghi danh"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-gray-400">
                                        <p>Chưa có dữ liệu ghi danh trong kỳ này</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* By Status */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Theo trạng thái</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(data.byStatus || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={data.byStatus}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                            >
                                                {(data.byStatus || []).map((entry, index) => (
                                                    <Cell
                                                        key={`cell-${index}`}
                                                        fill={STATUS_COLORS[entry.name] || CHART_COLORS[index]}
                                                    />
                                                ))}
                                            </Pie>
                                            <Tooltip />
                                            <Legend formatter={(value) => STATUS_LABELS[value] || value} />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-gray-400">
                                        <p>Chưa có dữ liệu</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* By Course */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ghi danh theo khóa học</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(data.byCourse || []).length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={(data.byCourse || []).slice(0, 8)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <Tooltip />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Số ghi danh" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-gray-400">
                                    <p>Chưa có dữ liệu khóa học</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Enrollments */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Ghi danh gần đây</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-gray-500">
                                            <th className="pb-3 font-medium">Học viên</th>
                                            <th className="pb-3 font-medium">Email</th>
                                            <th className="pb-3 font-medium">Khóa học</th>
                                            <th className="pb-3 font-medium">Lớp</th>
                                            <th className="pb-3 font-medium">Trạng thái</th>
                                            <th className="pb-3 font-medium">Ngày</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(data.recentEnrollments || []).length > 0 ? (
                                            (data.recentEnrollments || []).map((e) => (
                                                <tr key={e.id} className="text-sm">
                                                    <td className="py-3 font-medium">{e.studentName}</td>
                                                    <td className="py-3 text-gray-500">{e.studentEmail}</td>
                                                    <td className="py-3">{e.courseName}</td>
                                                    <td className="py-3">{e.className}</td>
                                                    <td className="py-3">
                                                        <span className={`px-2 py-1 rounded text-xs ${e.status === 'active' ? 'bg-green-100 text-green-700' :
                                                            e.status === 'dropped' ? 'bg-red-100 text-red-700' :
                                                                'bg-gray-100 text-gray-700'
                                                            }`}>
                                                            {STATUS_LABELS[e.status] || e.status}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-gray-500">
                                                        {new Date(e.createdAt).toLocaleDateString('vi-VN')}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="py-8 text-center text-gray-400">Chưa có ghi danh gần đây</td></tr>
                                        )}
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
                reportType="enrollment"
                filters={{ datePreset, customDates }}
                saving={savingReport}
            />
        </div>
    );
}
