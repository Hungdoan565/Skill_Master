/**
 * Reports Page - Trang chính module Báo cáo
 * 
 * Hiển thị danh sách các loại báo cáo có thể xem
 * Enhanced: Support classId URL param for class-specific context
 */

import { useState, useEffect, useCallback } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
    DollarSign,
    Users,
    ClipboardCheck,
    GraduationCap,
    UserCog,
    BookOpen,
    ArrowRight,
    Clock,
    Trash2,
    FileText,
    ArrowLeft,
    X
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useReports } from '../hooks/useReports';
import { useAuth } from '@/contexts/auth-context';
import { REPORT_TYPE_LABELS, API_URL } from '../utils/constants';

// Report cards config
const REPORT_CARDS = [
    {
        type: 'revenue',
        title: 'Báo cáo Doanh thu',
        description: 'Phân tích doanh thu, công nợ, thu chi theo kỳ',
        metricId: 'financial.revenue_total',
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        path: '/admin/reports/revenue'
    },
    {
        type: 'enrollment',
        title: 'Báo cáo Tuyển sinh',
        description: 'Thống kê ghi danh, tỷ lệ chuyển đổi, xu hướng',
        metricId: 'growth.enrollment_growth_mom',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        path: '/admin/reports/enrollment'
    },
    {
        type: 'attendance',
        title: 'Báo cáo Chuyên cần',
        description: 'Tỷ lệ đi học, vắng mặt, cảnh báo học viên',
        metricId: 'academic_quality.attendance_rate',
        icon: ClipboardCheck,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        path: '/admin/reports/attendance'
    },
    {
        type: 'grades',
        title: 'Báo cáo Điểm số',
        description: 'Phân bố điểm, tỷ lệ đậu/rớt, top học viên',
        metricId: 'academic_quality.learning_outcomes',
        icon: GraduationCap,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        path: '/admin/reports/grades'
    },
    {
        type: 'staff',
        title: 'Báo cáo Nhân sự',
        description: 'Giờ dạy, lương, hiệu suất giảng viên',
        metricId: 'capacity.active_staff',
        icon: UserCog,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        path: '/admin/reports/staff'
    },
    {
        type: 'courses',
        title: 'Báo cáo Khóa học',
        description: 'Hiệu suất khóa học, so sánh, xu hướng',
        metricId: 'capacity.class_fill_rate',
        icon: BookOpen,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        path: '/admin/reports/courses'
    }
];

export default function ReportsPage() {
    const { fetchSavedReports, deleteSavedReport, loading } = useReports();
    const { session, isSuperAdmin, profile } = useAuth();
    const [searchParams, setSearchParams] = useSearchParams();
    const [savedReports, setSavedReports] = useState([]);
    const [selectedClass, setSelectedClass] = useState(null);
    const [definitionVersion, setDefinitionVersion] = useState('n/a');
    const reportTitle = !isSuperAdmin?.() ? 'Báo cáo vận hành trung tâm' : 'Báo cáo & Thống kê';
    const reportSubtitle = !isSuperAdmin?.()
        ? `Phân tích dữ liệu trong phạm vi ${profile?.centers?.name || 'trung tâm đang phụ trách'}`
        : 'Phân tích dữ liệu chi tiết và xuất báo cáo';

    // Get classId from URL
    const classIdFromUrl = searchParams.get('classId');

    // Fetch class details if classId is provided
    const fetchClassDetails = useCallback(async () => {
        if (!classIdFromUrl || !session?.access_token) return;

        try {
            const response = await fetch(`${API_URL}/api/classes/${classIdFromUrl}`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });
            const data = await response.json();
            if (data.success) {
                setSelectedClass(data.data);
            }
        } catch (err) {
            console.error('Error fetching class:', err);
        }
    }, [classIdFromUrl, session]);

    const fetchKpiDefinitionVersion = useCallback(async () => {
        if (!session?.access_token) return;
        if (!isSuperAdmin?.()) {
            setDefinitionVersion('center-scoped');
            return;
        }

        try {
            const response = await fetch(`${API_URL}/api/admin/system-dashboard`, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`
                }
            });

            const payload = await response.json();
            if (payload?.success && payload?.meta?.definitionVersion) {
                setDefinitionVersion(payload.meta.definitionVersion);
            }
        } catch (err) {
            console.error('Error fetching KPI definition version:', err);
        }
    }, [isSuperAdmin, session]);

    useEffect(() => {
        loadSavedReports();
        fetchClassDetails();
        fetchKpiDefinitionVersion();
    }, [fetchClassDetails, fetchKpiDefinitionVersion]);

    // Clear class filter
    const clearClassFilter = () => {
        setSelectedClass(null);
        setSearchParams({});
    };

    // Get report path with classId if available
    const getReportPath = (basePath) => {
        if (classIdFromUrl) {
            return `${basePath}?classId=${classIdFromUrl}`;
        }
        return basePath;
    };

    const loadSavedReports = async () => {
        const data = await fetchSavedReports();
        if (data) {
            setSavedReports(data);
        }
    };

    const handleDeleteSaved = async (id) => {
        if (!confirm('Xóa báo cáo đã lưu này?')) return;
        const success = await deleteSavedReport(id);
        if (success) {
            setSavedReports(prev => prev.filter(r => r.id !== id));
        }
    };

    return (
        <div className="p-6 space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-foreground">{reportTitle}</h1>
                    <p className="text-muted-foreground mt-1">
                        {reportSubtitle}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Chuẩn KPI: phiên bản {definitionVersion}
                    </p>
                </div>
                {selectedClass && (
                    <Link to={`/admin/classes/${selectedClass.id}`}>
                        <Button variant="outline" size="sm">
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Quay lại lớp học
                        </Button>
                    </Link>
                )}
            </div>

            {/* Class Context Banner */}
            {selectedClass && (
                <Card className="border-blue-200 bg-blue-50/50">
                    <CardContent className="py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg">
                                    <GraduationCap className="h-5 w-5 text-blue-600" />
                                </div>
                                <div>
                                    <p className="text-sm text-blue-600 font-medium">Đang xem báo cáo cho lớp</p>
                                    <p className="font-semibold text-blue-900">{selectedClass.name}</p>
                                    {selectedClass.course_title && (
                                        <p className="text-xs text-blue-600">{selectedClass.course_title}</p>
                                    )}
                                </div>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={clearClassFilter}
                                className="text-blue-600 hover:text-blue-700 hover:bg-blue-100"
                            >
                                <X className="h-4 w-4 mr-1" />
                                Xem tất cả
                            </Button>
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Report Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_CARDS.map((report) => {
                    const Icon = report.icon;
                    // Highlight relevant reports when class is selected
                    const isRelevant = selectedClass && ['attendance', 'grades'].includes(report.type);

                    return (
                        <Link key={report.type} to={getReportPath(report.path)}>
                            <Card className={`h-full hover:shadow-md transition-shadow cursor-pointer group ${isRelevant ? 'ring-2 ring-blue-300 bg-blue-50/30' : ''
                                }`}>
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-lg ${report.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${report.color}`} />
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {isRelevant && (
                                                <Badge variant="secondary" className="text-xs bg-blue-100 text-blue-700">
                                                    Liên quan
                                                </Badge>
                                            )}
                                            <ArrowRight className="h-5 w-5 text-muted-foreground group-hover:text-muted-foreground group-hover:translate-x-1 transition-all" />
                                        </div>
                                    </div>
                                    <CardTitle className="text-lg mt-3">{report.title}</CardTitle>
                                    <CardDescription>{report.description}</CardDescription>
                                </CardHeader>
                            </Card>
                        </Link>
                    );
                })}
            </div>

            {/* Saved Reports */}
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Báo cáo đã lưu
                    </CardTitle>
                    <CardDescription>
                        Các báo cáo bạn đã lưu để xem nhanh
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {loading ? (
                        <div className="text-center py-8 text-muted-foreground">
                            Đang tải...
                        </div>
                    ) : savedReports.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Chưa có báo cáo nào được lưu</p>
                            <p className="text-sm mt-1">Khi xem báo cáo, bạn có thể lưu lại để xem nhanh sau này</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-3 bg-muted rounded-lg hover:bg-muted"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-card rounded">
                                            <FileText className="h-5 w-5 text-muted-foreground" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{report.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                                <span className="px-2 py-0.5 bg-muted/70 rounded text-xs">
                                                    {REPORT_TYPE_LABELS[report.report_type] || report.report_type}
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <Clock className="h-3 w-3" />
                                                    {new Date(report.created_at).toLocaleDateString('vi-VN')}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Link to={`/admin/reports/${report.report_type}`}>
                                            <Button variant="outline" size="sm">
                                                Xem
                                            </Button>
                                        </Link>
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => handleDeleteSaved(report.id)}
                                        >
                                            <Trash2 className="h-4 w-4 text-red-500" />
                                        </Button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
