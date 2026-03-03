import { gooeyToast } from 'goey-toast';
/**
 * Staff Report Page - Báo cáo nhân sự
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    Users,
    Clock,
    DollarSign,
    Award,
    RefreshCw,
    Filter,
    Save
} from 'lucide-react';
import {
    BarChart,
    Bar,
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
import { formatNumber, formatCurrency, DATE_PRESETS, getDateRangeFromPreset, exportReportToExcel } from '../utils';

export default function StaffReportPage() {
    const { fetchStaffReport, saveReport, loading, error } = useReports();

    const [isSystemWide, setIsSystemWide] = useState(false);
    const [data, setData] = useState(null);
    const [datePreset, setDatePreset] = useState('thisMonth');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [exporting, setExporting] = useState(false);

    useEffect(() => {
        loadReport();
    }, [datePreset, isSystemWide]);

    const loadReport = async () => {
        let startDate, endDate;

        if (datePreset === 'custom' && customDates.start && customDates.end) {
            startDate = customDates.start;
            endDate = customDates.end;
        } else {
            const range = getDateRangeFromPreset(datePreset);
            startDate = range.start;
            endDate = range.end;
        }

        const result = await fetchStaffReport({ startDate, endDate, system_wide: isSystemWide });
        if (result) {
            setData(result);
        }
    };

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportReportToExcel('staff', data, data.period);
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
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Nhân sự</h1>
                        <p className="text-gray-500">
                            {data?.period?.startDate} - {data?.period?.endDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <CrossCenterToggle value={isSystemWide} onChange={setIsSystemWide} />
                    <Button variant="outline" onClick={handleSaveReport}>
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
                                        <p className="text-sm text-gray-500">Tổng nhân sự</p>
                                        <p className="text-2xl font-bold text-gray-900">
                                            {formatNumber(data.summary.totalStaff)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatNumber(data.summary.teachers)} giáo viên
                                        </p>
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
                                        <p className="text-sm text-gray-500">Tổng buổi dạy</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatNumber(data.summary.totalSessions)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <Award className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng giờ dạy</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {formatNumber(data.summary.totalHours)}h
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            TB: {data.summary.avgHoursPerTeacher}h/GV
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <Clock className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tổng lương</p>
                                        <p className="text-2xl font-bold text-amber-600">
                                            {formatCurrency(data.summary.totalPayroll)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-amber-50 rounded-lg">
                                        <DollarSign className="h-6 w-6 text-amber-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Top Teachers Chart */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Top giảng viên theo giờ dạy</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={data.topTeachers} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis dataKey="name" type="category" width={150} />
                                    <Tooltip />
                                    <Legend />
                                    <Bar dataKey="hours" fill="#8b5cf6" radius={[0, 4, 4, 0]} name="Số giờ" />
                                    <Bar dataKey="sessions" fill="#3b82f6" radius={[0, 4, 4, 0]} name="Số buổi" />
                                </BarChart>
                            </ResponsiveContainer>
                        </CardContent>
                    </Card>

                    {/* Staff List */}
                    <Card>
                        <CardHeader>
                            <CardTitle>Danh sách nhân sự</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-gray-500">
                                            <th className="pb-3 font-medium">Nhân viên</th>
                                            <th className="pb-3 font-medium">Email</th>
                                            <th className="pb-3 font-medium">Vai trò</th>
                                            <th className="pb-3 font-medium text-center">Số buổi</th>
                                            <th className="pb-3 font-medium text-center">Số giờ</th>
                                            <th className="pb-3 font-medium text-right">Lương</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.staffList.map((staff) => (
                                            <tr key={staff.id} className="text-sm">
                                                <td className="py-3 font-medium">{staff.name}</td>
                                                <td className="py-3 text-gray-500">{staff.email}</td>
                                                <td className="py-3">
                                                    <span className={`px-2 py-1 rounded text-xs ${staff.role === 'Teacher' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-purple-100 text-purple-700'
                                                        }`}>
                                                        {staff.role}
                                                    </span>
                                                </td>
                                                <td className="py-3 text-center">{staff.sessions}</td>
                                                <td className="py-3 text-center">{staff.hours}h</td>
                                                <td className="py-3 text-right font-medium text-green-600">
                                                    {formatCurrency(staff.totalPay)}
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
                reportType="staff"
                filters={{ datePreset, customDates }}
                saving={savingReport}
            />
        </div>
    );
}
