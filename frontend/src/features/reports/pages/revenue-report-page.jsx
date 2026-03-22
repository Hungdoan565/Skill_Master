import { gooeyToast } from 'goey-toast';
/**
 * Revenue Report Page - Báo cáo doanh thu chi tiết
 */

import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    TrendingUp,
    TrendingDown,
    DollarSign,
    CreditCard,
    Receipt,
    Calendar,
    Filter,
    RefreshCw,
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
    formatCurrency,
    formatNumber,
    formatPercent,
    DATE_PRESETS,
    getDateRangeFromPreset,
    formatDateParam,
    CHART_COLORS,
    PAYMENT_METHOD_LABELS,
    exportReportToExcel
} from '../utils';


export default function RevenueReportPage() {
    const { fetchRevenueReport, saveReport, loading, error } = useReports();

    // State
    const [isSystemWide, setIsSystemWide] = useState(false);
    const [data, setData] = useState(null);
    const [datePreset, setDatePreset] = useState('30days');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [groupBy, setGroupBy] = useState('day');
    const [filters, setFilters] = useState({
        centerId: '',
        courseId: ''
    });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Load data on mount and when filters change
    const loadReport = useCallback(async () => {
        let startDate, endDate;

        if (datePreset === 'custom' && customDates.start && customDates.end) {
            // Validate: start must be <= end
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

        const result = await fetchRevenueReport({
            startDate,
            endDate,
            groupBy,
            system_wide: isSystemWide,
            ...filters
        });

        if (result) {
            setData(result);
        }
    }, [datePreset, customDates, groupBy, isSystemWide, filters, fetchRevenueReport]);

    useEffect(() => {
        loadReport();
    }, [loadReport]);

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportReportToExcel('revenue', data, data.period);
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
                    <p className="mt-2 text-muted-foreground">Đang tải báo cáo...</p>
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
                        <h1 className="text-2xl font-bold text-foreground">Báo cáo Doanh thu</h1>
                        <p className="text-muted-foreground">
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
                        {/* Date Preset */}
                        <div>
                            <Label className="text-xs text-muted-foreground">Khoảng thời gian</Label>
                            <select
                                value={datePreset}
                                onChange={(e) => setDatePreset(e.target.value)}
                                className="mt-1 block w-40 rounded-md border border-border px-3 py-2 text-sm"
                            >
                                {DATE_PRESETS.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                        </div>

                        {/* Custom dates */}
                        {datePreset === 'custom' && (
                            <>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Từ ngày</Label>
                                    <Input
                                        type="date"
                                        value={customDates.start}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, start: e.target.value }))}
                                        className="mt-1 w-40"
                                    />
                                </div>
                                <div>
                                    <Label className="text-xs text-muted-foreground">Đến ngày</Label>
                                    <Input
                                        type="date"
                                        value={customDates.end}
                                        onChange={(e) => setCustomDates(prev => ({ ...prev, end: e.target.value }))}
                                        className="mt-1 w-40"
                                    />
                                </div>
                            </>
                        )}

                        {/* Group by */}
                        <div>
                            <Label className="text-xs text-muted-foreground">Nhóm theo</Label>
                            <select
                                value={groupBy}
                                onChange={(e) => setGroupBy(e.target.value)}
                                className="mt-1 block w-32 rounded-md border border-border px-3 py-2 text-sm"
                            >
                                <option value="day">Ngày</option>
                                <option value="week">Tuần</option>
                                <option value="month">Tháng</option>
                            </select>
                        </div>

                        <div className="flex items-end">
                            <Button onClick={loadReport} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại
                            </Button>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Error */}
            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {data && (
                <>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        {/* Total Revenue */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Tổng doanh thu</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {formatCurrency(data.summary.totalRevenue)}
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
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Transactions */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Số giao dịch</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {formatNumber(data.summary.totalTransactions)}
                                        </p>
                                        <p className="text-sm text-muted-foreground mt-1">
                                            trong {data.period.days} ngày
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <Receipt className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Average */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">TB mỗi giao dịch</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {formatCurrency(data.summary.averageTransaction)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <CreditCard className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        {/* Previous Period */}
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-muted-foreground">Kỳ trước</p>
                                        <p className="text-2xl font-bold text-foreground">
                                            {formatCurrency(data.summary.prevRevenue)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-muted rounded-lg">
                                        <Calendar className="h-6 w-6 text-muted-foreground" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts Row */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Revenue Chart */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Biểu đồ doanh thu</CardTitle>
                                <CardDescription>Doanh thu theo {groupBy === 'day' ? 'ngày' : groupBy === 'week' ? 'tuần' : 'tháng'}</CardDescription>
                            </CardHeader>
                            <CardContent>
                                {(data.chartData || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={300}>
                                        <AreaChart data={data.chartData}>
                                            <defs>
                                                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
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
                                            <YAxis
                                                tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`}
                                            />
                                            <Tooltip
                                                formatter={(val) => formatCurrency(val)}
                                                labelFormatter={(val) => new Date(val).toLocaleDateString('vi-VN')}
                                            />
                                            <Area
                                                type="monotone"
                                                dataKey="revenue"
                                                stroke="#3b82f6"
                                                strokeWidth={2}
                                                fill="url(#colorRevenue)"
                                                name="Doanh thu"
                                            />
                                        </AreaChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                        <p>Chưa có dữ liệu doanh thu trong kỳ này</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>

                        {/* Payment Method Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Phương thức thanh toán</CardTitle>
                            </CardHeader>
                            <CardContent>
                                {(data.byPaymentMethod || []).length > 0 ? (
                                    <ResponsiveContainer width="100%" height={250}>
                                        <PieChart>
                                            <Pie
                                                data={data.byPaymentMethod}
                                                cx="50%"
                                                cy="50%"
                                                innerRadius={50}
                                                outerRadius={80}
                                                paddingAngle={5}
                                                dataKey="value"
                                                nameKey="name"
                                            >
                                                {(data.byPaymentMethod || []).map((entry, index) => (
                                                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                                                ))}
                                            </Pie>
                                            <Tooltip formatter={(val) => formatCurrency(val)} />
                                            <Legend
                                                formatter={(value) => PAYMENT_METHOD_LABELS[value] || value}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                ) : (
                                    <div className="flex items-center justify-center h-[250px] text-muted-foreground">
                                        <p>Chưa có dữ liệu</p>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Revenue by Course */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Doanh thu theo khóa học</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {(data.byCourse || []).length > 0 ? (
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={(data.byCourse || []).slice(0, 8)} layout="vertical">
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis type="number" tickFormatter={(val) => `${(val / 1000000).toFixed(0)}M`} />
                                        <YAxis dataKey="name" type="category" width={150} />
                                        <Tooltip formatter={(val) => formatCurrency(val)} />
                                        <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Doanh thu" />
                                    </BarChart>
                                </ResponsiveContainer>
                            ) : (
                                <div className="flex items-center justify-center h-[300px] text-muted-foreground">
                                    <p>Chưa có dữ liệu khóa học</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Recent Transactions */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Giao dịch gần đây</CardTitle>
                            <CardDescription>10 giao dịch mới nhất trong kỳ</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-muted-foreground">
                                            <th className="pb-3 font-medium">Mã HĐ</th>
                                            <th className="pb-3 font-medium">Học viên</th>
                                            <th className="pb-3 font-medium">Khóa học</th>
                                            <th className="pb-3 font-medium">PT Thanh toán</th>
                                            <th className="pb-3 font-medium">Ngày</th>
                                            <th className="pb-3 font-medium text-right">Số tiền</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {(data.topTransactions || []).length > 0 ? (
                                            (data.topTransactions || []).map((tx) => (
                                                <tr key={tx.id} className="text-sm">
                                                    <td className="py-3 font-mono text-blue-600">{tx.invoiceCode}</td>
                                                    <td className="py-3">{tx.studentName}</td>
                                                    <td className="py-3">{tx.courseName}</td>
                                                    <td className="py-3">
                                                        <span className="px-2 py-1 bg-muted rounded text-xs">
                                                            {PAYMENT_METHOD_LABELS[tx.method] || tx.method}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-muted-foreground">
                                                        {new Date(tx.paymentDate).toLocaleDateString('vi-VN')}
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-green-600">
                                                        {formatCurrency(tx.amount)}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr><td colSpan={6} className="py-8 text-center text-muted-foreground">Chưa có giao dịch trong kỳ này</td></tr>
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
                reportType="revenue"
                filters={{ datePreset, customDates, groupBy, ...filters }}
                saving={savingReport}
            />
        </div>
    );
}
