/**
 * Reports Page - Trang chính module Báo cáo
 * 
 * Hiển thị danh sách các loại báo cáo có thể xem
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
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
    FileText
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useReports } from '../hooks/useReports';
import { REPORT_TYPE_LABELS } from '../utils/constants';

// Report cards config
const REPORT_CARDS = [
    {
        type: 'revenue',
        title: 'Báo cáo Doanh thu',
        description: 'Phân tích doanh thu, công nợ, thu chi theo kỳ',
        icon: DollarSign,
        color: 'text-green-600',
        bgColor: 'bg-green-50',
        path: '/admin/reports/revenue'
    },
    {
        type: 'enrollment',
        title: 'Báo cáo Tuyển sinh',
        description: 'Thống kê ghi danh, tỷ lệ chuyển đổi, xu hướng',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50',
        path: '/admin/reports/enrollment'
    },
    {
        type: 'attendance',
        title: 'Báo cáo Chuyên cần',
        description: 'Tỷ lệ đi học, vắng mặt, cảnh báo học viên',
        icon: ClipboardCheck,
        color: 'text-amber-600',
        bgColor: 'bg-amber-50',
        path: '/admin/reports/attendance'
    },
    {
        type: 'grades',
        title: 'Báo cáo Điểm số',
        description: 'Phân bố điểm, tỷ lệ đậu/rớt, top học viên',
        icon: GraduationCap,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50',
        path: '/admin/reports/grades'
    },
    {
        type: 'staff',
        title: 'Báo cáo Nhân sự',
        description: 'Giờ dạy, lương, hiệu suất giảng viên',
        icon: UserCog,
        color: 'text-rose-600',
        bgColor: 'bg-rose-50',
        path: '/admin/reports/staff'
    },
    {
        type: 'courses',
        title: 'Báo cáo Khóa học',
        description: 'Hiệu suất khóa học, so sánh, xu hướng',
        icon: BookOpen,
        color: 'text-indigo-600',
        bgColor: 'bg-indigo-50',
        path: '/admin/reports/courses'
    }
];

export default function ReportsPage() {
    const { fetchSavedReports, deleteSavedReport, loading } = useReports();
    const [savedReports, setSavedReports] = useState([]);

    useEffect(() => {
        loadSavedReports();
    }, []);

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
            <div>
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo & Thống kê</h1>
                <p className="text-gray-500 mt-1">
                    Phân tích dữ liệu chi tiết và xuất báo cáo
                </p>
            </div>

            {/* Report Type Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {REPORT_CARDS.map((report) => {
                    const Icon = report.icon;
                    return (
                        <Link key={report.type} to={report.path}>
                            <Card className="h-full hover:shadow-md transition-shadow cursor-pointer group">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between">
                                        <div className={`p-3 rounded-lg ${report.bgColor}`}>
                                            <Icon className={`h-6 w-6 ${report.color}`} />
                                        </div>
                                        <ArrowRight className="h-5 w-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
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
                        <div className="text-center py-8 text-gray-500">
                            Đang tải...
                        </div>
                    ) : savedReports.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-30" />
                            <p>Chưa có báo cáo nào được lưu</p>
                            <p className="text-sm mt-1">Khi xem báo cáo, bạn có thể lưu lại để xem nhanh sau này</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            {savedReports.map((report) => (
                                <div
                                    key={report.id}
                                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-white rounded">
                                            <FileText className="h-5 w-5 text-gray-600" />
                                        </div>
                                        <div>
                                            <p className="font-medium text-gray-900">{report.name}</p>
                                            <div className="flex items-center gap-2 text-sm text-gray-500">
                                                <span className="px-2 py-0.5 bg-gray-200 rounded text-xs">
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
