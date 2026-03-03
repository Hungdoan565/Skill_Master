import { gooeyToast } from 'goey-toast';
/**
 * Grades Report Page - Báo cáo điểm số
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
    GraduationCap,
    Award,
    TrendingUp,
    AlertTriangle,
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
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useReports } from '../hooks/useReports';
import { useAuth } from '@/contexts/auth-context';
import { SaveReportModal, ClassFilter, ReportPDFExport } from '../components';
import { formatNumber, formatPercent, CHART_COLORS, API_URL, exportReportToExcel } from '../utils';

export default function GradesReportPage() {
    const { fetchGradesReport, saveReport, loading, error } = useReports();
    const { session } = useAuth();
    const [searchParams] = useSearchParams();
    const reportContentRef = useRef(null);
    const [data, setData] = useState(null);

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

    // Fetch courses and classes for filter dropdowns
    const fetchFilterData = useCallback(async () => {
        if (!session?.access_token) return;

        const headers = {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`
        };

        try {
            // Fetch courses
            const coursesRes = await fetch(`${API_URL}/api/courses`, { headers });
            const coursesData = await coursesRes.json();
            if (coursesData.success) {
                setCourses(coursesData.data || []);
            }

            // Fetch classes
            const classesRes = await fetch(`${API_URL}/api/classes`, { headers });
            const classesData = await classesRes.json();
            if (classesData.success) {
                setClasses(classesData.data || []);
            }
        } catch (err) {
            console.error('Error fetching filter data:', err);
        }
    }, [session]);

    useEffect(() => {
        fetchFilterData();
        loadReport();
    }, []);

    const loadReport = async () => {
        const result = await fetchGradesReport({
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
            await exportReportToExcel('grades', data);
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
                        <h1 className="text-2xl font-bold text-gray-900">Báo cáo Điểm số</h1>
                        <p className="text-gray-500">Thống kê điểm số học viên</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button variant="outline" onClick={handleSaveReport}>
                        <Save className="h-4 w-4 mr-2" />
                        Lưu báo cáo
                    </Button>
                    <ReportPDFExport
                        reportData={data}
                        reportTitle="Báo cáo Điểm số"
                        filename={`bao-cao-diem-so-${new Date().toISOString().split('T')[0]}`}
                        headerInfo={{
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
                        {/* Course Filter */}
                        <div>
                            <Label className="text-xs text-gray-500">Khóa học</Label>
                            <select
                                value={selectedCourseId}
                                onChange={(e) => setSelectedCourseId(e.target.value)}
                                className="mt-1 block w-48 rounded-md border border-gray-300 px-3 py-2 text-sm"
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
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Tỷ lệ đậu</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {formatPercent(data.summary.passRate, 0)}
                                        </p>
                                        <p className="text-sm text-gray-500 mt-1">
                                            {formatNumber(data.summary.passedStudents)}/{formatNumber(data.summary.totalStudents)} học viên
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
                                        <p className="text-sm text-gray-500">Điểm TB</p>
                                        <p className="text-2xl font-bold text-blue-600">
                                            {data.summary.avgScore}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-blue-50 rounded-lg">
                                        <TrendingUp className="h-6 w-6 text-blue-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Điểm cao nhất</p>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {data.summary.maxScore}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-purple-50 rounded-lg">
                                        <GraduationCap className="h-6 w-6 text-purple-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardContent className="pt-6">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="text-sm text-gray-500">Điểm thấp nhất</p>
                                        <p className="text-2xl font-bold text-red-600">
                                            {data.summary.minScore}
                                        </p>
                                    </div>
                                    <div className="p-3 bg-red-50 rounded-lg">
                                        <AlertTriangle className="h-6 w-6 text-red-600" />
                                    </div>
                                </div>
                            </CardContent>
                        </Card>
                    </div>

                    {/* Charts */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                        {/* Score Distribution */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Phân bố điểm số</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <BarChart data={data.distribution}>
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis dataKey="range" />
                                        <YAxis />
                                        <Tooltip />
                                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]} name="Số học viên" />
                                    </BarChart>
                                </ResponsiveContainer>
                            </CardContent>
                        </Card>

                        {/* Pass Rate Pie */}
                        <Card>
                            <CardHeader>
                                <CardTitle>Tỷ lệ đậu/rớt</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <ResponsiveContainer width="100%" height={300}>
                                    <PieChart>
                                        <Pie
                                            data={data.passRateChart}
                                            cx="50%"
                                            cy="50%"
                                            innerRadius={60}
                                            outerRadius={100}
                                            paddingAngle={5}
                                            dataKey="value"
                                            label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                                        >
                                            {data.passRateChart.map((entry, index) => (
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

                    {/* Top Students */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <Award className="h-5 w-5 text-amber-500" />
                                Top 10 Học viên xuất sắc
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            <div className="overflow-x-auto">
                                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                    <thead>
                                        <tr className="border-b text-left text-sm text-gray-500">
                                            <th className="pb-3 font-medium w-12">#</th>
                                            <th className="pb-3 font-medium">Học viên</th>
                                            <th className="pb-3 font-medium">Khóa học</th>
                                            <th className="pb-3 font-medium text-center">Điểm TB</th>
                                            <th className="pb-3 font-medium text-center">Kết quả</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y">
                                        {data.topStudents.map((student, index) => (
                                            <tr key={index} className="text-sm">
                                                <td className="py-3">
                                                    {index < 3 ? (
                                                        <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${index === 0 ? 'bg-amber-400' :
                                                            index === 1 ? 'bg-gray-400' :
                                                                'bg-amber-700'
                                                            }`}>
                                                            {index + 1}
                                                        </span>
                                                    ) : (
                                                        <span className="text-gray-500">{index + 1}</span>
                                                    )}
                                                </td>
                                                <td className="py-3 font-medium">{student.studentName}</td>
                                                <td className="py-3 text-gray-600">{student.courseName}</td>
                                                <td className="py-3 text-center">
                                                    <span className="font-bold text-green-600">{student.finalScore}</span>
                                                </td>
                                                <td className="py-3 text-center">
                                                    <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs">
                                                        Đạt
                                                    </span>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Low Score Students */}
                    {data.lowScoreStudents.length > 0 && (
                        <Card className="border-red-200 bg-red-50/50">
                            <CardHeader>
                                <CardTitle className="flex items-center gap-2 text-red-700">
                                    <AlertTriangle className="h-5 w-5" />
                                    Học viên cần cải thiện
                                </CardTitle>
                                <CardDescription>
                                    Học viên chưa đạt điểm chuẩn, cần hỗ trợ thêm
                                </CardDescription>
                            </CardHeader>
                            <CardContent>
                                <div className="overflow-x-auto">
                                    <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                                        <thead>
                                            <tr className="border-b text-left text-sm text-gray-600">
                                                <th className="pb-3 font-medium">Học viên</th>
                                                <th className="pb-3 font-medium">Khóa học</th>
                                                <th className="pb-3 font-medium text-center">Điểm TB</th>
                                                <th className="pb-3 font-medium text-center">Điểm chuẩn</th>
                                                <th className="pb-3 font-medium text-center">Thiếu</th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y">
                                            {data.lowScoreStudents.map((student, index) => (
                                                <tr key={index} className="text-sm">
                                                    <td className="py-3 font-medium">{student.studentName}</td>
                                                    <td className="py-3 text-gray-600">{student.courseName}</td>
                                                    <td className="py-3 text-center">
                                                        <span className="font-bold text-red-600">{student.finalScore}</span>
                                                    </td>
                                                    <td className="py-3 text-center text-gray-500">
                                                        {student.passScore}
                                                    </td>
                                                    <td className="py-3 text-center">
                                                        <span className="text-red-600 font-medium">
                                                            -{(student.passScore - student.finalScore).toFixed(2)}
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
                reportType="grades"
                filters={{ selectedCourseId, selectedClassId }}
                saving={savingReport}
            />
        </div>
    );
}
