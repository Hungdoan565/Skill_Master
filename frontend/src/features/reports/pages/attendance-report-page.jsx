import { toast } from "sonner";
/**
 * Attendance Report Page - Báo cáo chuyên cần
 * 
 * Enhanced with:
 * - URL params support (classId, courseId)
 * - ClassFilter component
 * - PDF export capability
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    ArrowLeft,
    Download,
    ClipboardCheck,
    UserX,
    Clock,
    AlertTriangle,
    RefreshCw,
    Filter,
    Save,
    FileText,
    GraduationCap
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
    ResponsiveContainer,
    LineChart,
    Line
} from 'recharts';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useReports } from '../hooks/useReports';
import { useAuth } from '@/contexts/auth-context';
import { SaveReportModal, ClassFilter, ReportPDFExport } from '../components';
import {
    formatNumber,
    formatPercent,
    DATE_PRESETS,
    getDateRangeFromPreset,
    ATTENDANCE_STATUS_LABELS,
    API_URL,
    exportReportToExcel
} from '../utils';

export default function AttendanceReportPage() {
    const { fetchAttendanceReport, saveReport, loading, error } = useReports();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const reportContentRef = useRef(null);

    const [data, setData] = useState(null);
    const [datePreset, setDatePreset] = useState('30days');
    const [customDates, setCustomDates] = useState({ start: '', end: '' });

    // Filters state
    const [courses, setCourses] = useState([]);
    const [classes, setClasses] = useState([]);
    const [selectedCourseId, setSelectedCourseId] = useState('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [showSaveModal, setShowSaveModal] = useState(false);
    const [savingReport, setSavingReport] = useState(false);
    const [exporting, setExporting] = useState(false);

    // Initialize from URL params
    useEffect(() => {
        const classIdFromUrl = searchParams.get('classId');
        const courseIdFromUrl = searchParams.get('courseId');

        if (classIdFromUrl) setSelectedClassId(classIdFromUrl);
        if (courseIdFromUrl) setSelectedCourseId(courseIdFromUrl);
    }, [searchParams]);

    // Fetch filter data
    const fetchFilterData = useCallback(async () => {
        if (!session?.access_token) return;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            const [coursesRes, classesRes] = await Promise.all([
                fetch(`${API_URL}/api/courses`, { headers }),
                fetch(`${API_URL}/api/classes`, { headers })
            ]);

            const [coursesData, classesData] = await Promise.all([
                coursesRes.json(),
                classesRes.json()
            ]);

            if (coursesData.success) setCourses(coursesData.data || []);
            if (classesData.success) setClasses(classesData.data || []);
        } catch (err) {
            console.error('Error fetching filter data:', err);
        }
    }, [session]);

    useEffect(() => {
        fetchFilterData();
    }, [fetchFilterData]);

    useEffect(() => {
        loadReport();
    }, [datePreset]);

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

        const result = await fetchAttendanceReport({
            startDate,
            endDate,
            courseId: selectedCourseId || undefined,
            classId: selectedClassId || undefined
        });
        if (result) {
            setData(result);
        }
    };

    const handleExport = async () => {
        if (!data) return;
        setExporting(true);
        try {
            await exportReportToExcel('attendance', data, data.period);
        } catch (err) {
            console.error('Export error:', err);
            toast('Lỗi khi xuất Excel: ' + err.message);
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
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Chuyên cần</h1>
                        <p className="text-gray-500">
                            {data?.period?.startDate} - {data?.period?.endDate}
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveReport}>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu báo cáo
                    </Button>
                    <ReportPDFExport
                        contentRef={reportContentRef}
                        reportTitle="Báo cáo Chuyên cần"
                        filename={`bao-cao-chuyen-can-${new Date().toISOString().split('T')[0]}`}
                        headerInfo={{
                            period: data ? `${data.period?.startDate} - ${data.period?.endDate}` : '',
                            className: selectedClassId ? classes.find(c => c.id === selectedClassId)?.name : 'Tất cả lớp'
                        }}
                        disabled={!data}
                    />
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

                        {/* Course Filter */}
                        <div>
                            <Label className="text-xs text-gray-500">Khóa học</Label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="mt-1 block w-44 rounded-md border border-gray-300 px-3 py-2 text-sm"
                            >
                                <option value="">Tất cả khóa học</option>
                                {courses.map(c => (
                                    <option key={c.id} value={c.id}>{c.title}</option>
                                ))}
                            </select>
                        </div>

                        {/* Class Filter - Enhanced Component */}
                        <ClassFilter
                            classes={classes}
                            courses={courses}
                            value={selectedClassId}
                            onChange={setSelectedClassId}
                            placeholder="Tất cả lớp"
                        />

                        <div className="flex items-end">
                            <Button onClick={loadReport} disabled={loading}>
                                <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                                Tải lại
                            </Button>
                        </div>
                    </div>

                    {/* Show selected class info */}
                    {selectedClassId && (
                        <div className="mt-3 flex items-center gap-2">
                            <Badge variant="secondary" className="flex items-center gap-1">
                                <GraduationCap className="h-3 w-3" />
                                Đang xem: {classes.find(c => c.id === selectedClassId)?.name}
                            </Badge>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => setSelectedClassId('')}
                                className="h-6 text-xs"
                            >
                                Xem tất cả lớp
                            </Button>
                        </div>
                    )}
                </CardContent>
            </Card>

            {error && (
                <div className="bg-red-50 text-red-600 p-4 rounded-lg">{error}</div>
            )}

            {data && (
                <div ref={reportContentRef}>
                    {/* Summary Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tỷ lệ đi học</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatPercent(data.summary.attendanceRate, 0)}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-green-50 rounded-lg">
                                        <ClipboardCheck className="h-6 w-6 text-green-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Có mặt</p>
                                    <p className="text-2xl font-bold text-green-600">
                                        {formatNumber(data.summary.presentCount)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Vắng</p>
                                    <p className="text-2xl font-bold text-red-600">
                                        {formatNumber(data.summary.absentCount)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Trễ</p>
                                    <p className="text-2xl font-bold text-amber-600">
                                        {formatNumber(data.summary.lateCount)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="text-center">
                                    <p className="text-sm text-gray-500">Có phép</p>
                                    <p className="text-2xl font-bold text-blue-600">
                                        {formatNumber(data.summary.excusedCount)}
                                    </p>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                        {/* Attendance Trend */}
                        <Card className="lg:col-span-2">
                            <CardHeader>
                                <CardTitle>Xu hướng điểm danh theo ngày</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.chartData}>
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
                                        <Legend />
                                        <Bar dataKey="present" stackId="a" fill="#22c55e" name="Có mặt" />
                                        <Bar dataKey="late" stackId="a" fill="#f59e0b" name="Trễ" />
                                        <Bar dataKey="excused" stackId="a" fill="#3b82f6" name="Có phép" />
                                        <Bar dataKey="absent" stackId="a" fill="#ef4444" name="Vắng" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* By Status Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Phân bố trạng thái</CardTitle>
                            </CardHeader>
                            <CardContent>
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
                                            {data.byStatus.map((entry, index) => (
                                                <Cell key={`cell-${index}`} fill={entry.color} />
                                            ))}
                                        </Pie>
                                        <Tooltip />
                                        <Legend />
                                    </PieChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Low Attendance Students */}
                    {data.lowAttendanceStudents.length > 0 && (
                        <Card className="border-amber-200 bg-amber-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-amber-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    Học viên cần chú ý (Tỷ lệ đi học &lt; 70%)
                                </CardTitle>
                                <CardDescription>
                                    Những học viên có tỷ lệ đi học thấp cần được liên hệ
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                        <thead>
                                            <tr className="border-b text-left text-sm text-gray-600">
                                                <th className="pb-3 font-medium">Học viên</th>
                                                <th className="pb-3 font-medium text-center">Tổng buổi</th>
                                                <th className="pb-3 font-medium text-center">Có mặt</th>
                                                <th className="pb-3 font-medium text-center">Tỷ lệ</th>
                                                <th className="pb-3 font-medium">Trạng thái</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.lowAttendanceStudents.map((student) => (
                                                <tr key={student.id} className="text-sm">
                                                    <td className="py-3 font-medium">{student.name}</td>
                                                    <td className="py-3 text-center">{student.total}</td>
                                                    <td className="py-3 text-center">{student.present}</td>
                                                    <td className="py-3 text-center">
                                                        <span className={`px-2 py-1 rounded text-xs font-medium ${student.rate < 50 ? 'bg-red-100 text-red-700' :
                                                            student.rate < 70 ? 'bg-amber-100 text-amber-700' :
                                                                'bg-green-100 text-green-700'
                                                            }`}>
                                                            {formatPercent(student.rate, 0)}
                                                        </span>
                                                    </td>
                                                    <td className="py-3">
                                                        <span className="flex items-center gap-1 text-amber-600">
                                                            <AlertTriangle className="h-4 w-4" />
                                                            Cần liên hệ
                                                        </span>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>
                            </CardContent>
                        </Card>
                    )}
                </div>
            )}

            {/* Save Report Modal */}
            <SaveReportModal
                isOpen={showSaveModal}
                onClose={() => setShowSaveModal(false)}
                onSave={onSaveReport}
                reportType="attendance"
                filters={{ datePreset, customDates, selectedCourseId, selectedClassId }}
                saving={savingReport}
            />
        </div>
    );
}
