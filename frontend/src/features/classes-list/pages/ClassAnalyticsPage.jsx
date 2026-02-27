import { toast } from "sonner";
/**
 * ClassAnalyticsPage - Dashboard Analytics cho Classes
 * Displays KPIs, charts, and insights about classes
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowLeft,
    BookOpen,
    Users,
    Calendar,
    TrendingUp,
    AlertTriangle,
    CheckCircle,
    Clock,
    Building2,
    RefreshCw,
    Download,
    Filter
} from 'lucide-react';
import axios from 'axios';
import { supabase } from '@/lib/supabaseClient';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

// Import dashboard chart components
import { SimpleAreaChart } from '@/features/dashboard/components/SimpleAreaChart';
import { SimplePieChart } from '@/features/dashboard/components/SimplePieChart';
import { HorizontalBarChart } from '@/features/dashboard/components/HorizontalBarChart';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Helper: Get auth headers
const getAuthHeaders = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) throw new Error('Chưa đăng nhập');
    return { Authorization: `Bearer ${session.access_token}` };
};

// Status configuration
const STATUS_CONFIG = {
    upcoming: { label: 'Sắp mở', color: 'bg-blue-500' },
    ongoing: { label: 'Đang học', color: 'bg-green-500' },
    completed: { label: 'Đã kết thúc', color: 'bg-slate-400' },
    cancelled: { label: 'Đã hủy', color: 'bg-red-500' }
};

// Auto-refresh interval (5 minutes)
const AUTO_REFRESH_INTERVAL = 5 * 60 * 1000;

export function ClassAnalyticsPage() {
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [classes, setClasses] = useState([]);
    const [courses, setCourses] = useState([]);
    const [selectedCenter, setSelectedCenter] = useState('');
    const [centers, setCenters] = useState([]);
    const [dateRange, setDateRange] = useState('this_month');
    const [lastRefresh, setLastRefresh] = useState(new Date());
    const [autoRefreshEnabled, setAutoRefreshEnabled] = useState(true);

    // Fetch data
    const fetchData = useCallback(async (isAutoRefresh = false) => {
        try {
            const headers = await getAuthHeaders();

            const [classesRes, coursesRes, centersRes] = await Promise.all([
                axios.get(`${API_URL}/api/classes`, { headers }),
                axios.get(`${API_URL}/api/courses`),
                axios.get(`${API_URL}/api/admin/centers`, { headers })
            ]);

            if (classesRes.data?.success) setClasses(classesRes.data.data);
            if (coursesRes.data?.success) setCourses(coursesRes.data.data);
            if (centersRes.data?.success) setCenters(centersRes.data.data);
            setLastRefresh(new Date());
        } catch (error) {
            console.error('Error fetching analytics data:', error);
        } finally {
            setLoading(false);
            setRefreshing(false);
        }
    }, []);

    // Initial fetch
    useEffect(() => {
        fetchData();
    }, [fetchData]);

    // Auto-refresh every 5 minutes
    useEffect(() => {
        if (!autoRefreshEnabled) return;

        const intervalId = setInterval(() => {
            console.log('🔄 Auto-refreshing analytics data...');
            fetchData(true);
        }, AUTO_REFRESH_INTERVAL);

        return () => clearInterval(intervalId);
    }, [fetchData, autoRefreshEnabled]);

    const handleRefresh = () => {
        setRefreshing(true);
        fetchData();
    };

    // Export to PDF function
    const handleExportPDF = async () => {
        try {
            // Dynamic import html2canvas and jspdf
            const html2canvas = (await import('html2canvas')).default;
            const { jsPDF } = await import('jspdf');

            const content = document.getElementById('analytics-content');
            if (!content) {
                toast('Không tìm thấy nội dung để xuất');
                return;
            }

            // Show loading
            setRefreshing(true);

            // Capture the content
            const canvas = await html2canvas(content, {
                scale: 2,
                useCORS: true,
                logging: false,
                backgroundColor: '#ffffff'
            });

            // Create PDF
            const imgWidth = 210; // A4 width in mm
            const pageHeight = 297; // A4 height in mm
            const imgHeight = (canvas.height * imgWidth) / canvas.width;

            const pdf = new jsPDF('p', 'mm', 'a4');

            // Add header
            pdf.setFontSize(18);
            pdf.setTextColor(30, 58, 138); // Indigo color
            pdf.text('BÁO CÁO PHÂN TÍCH LỚP HỌC', 105, 15, { align: 'center' });

            pdf.setFontSize(10);
            pdf.setTextColor(100, 100, 100);
            pdf.text(`Ngày xuất: ${new Date().toLocaleString('vi-VN')}`, 105, 22, { align: 'center' });
            pdf.text(`Tổng số lớp: ${analytics.total}`, 105, 27, { align: 'center' });

            // Add image
            const imgData = canvas.toDataURL('image/png');
            let heightLeft = imgHeight;
            let position = 35;

            pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
            heightLeft -= (pageHeight - position);

            // Add more pages if needed
            while (heightLeft > 0) {
                position = heightLeft - imgHeight;
                pdf.addPage();
                pdf.addImage(imgData, 'PNG', 0, position, imgWidth, imgHeight);
                heightLeft -= pageHeight;
            }

            // Save PDF
            const fileName = `BaoCao_PhanTich_LopHoc_${new Date().toISOString().split('T')[0]}.pdf`;
            pdf.save(fileName);

        } catch (error) {
            console.error('Error exporting PDF:', error);
            toast('Không thể xuất PDF. Vui lòng thử lại hoặc cài đặt thư viện html2canvas và jspdf.');
        } finally {
            setRefreshing(false);
        }
    };

    // Filter classes by center
    const filteredClasses = useMemo(() => {
        if (!selectedCenter) return classes;
        return classes.filter(c => c.center_id === selectedCenter);
    }, [classes, selectedCenter]);

    // Calculate analytics data
    const analytics = useMemo(() => {
        const data = filteredClasses;

        // Basic stats
        const total = data.length;
        const byStatus = {
            upcoming: data.filter(c => c.status === 'upcoming').length,
            ongoing: data.filter(c => c.status === 'ongoing').length,
            completed: data.filter(c => c.status === 'completed').length,
            cancelled: data.filter(c => c.status === 'cancelled').length
        };

        // Capacity stats
        const totalCapacity = data.reduce((sum, c) => sum + (c.max_students || 0), 0);
        const totalEnrolled = data.reduce((sum, c) => sum + (c.enrolled_count || 0), 0);
        const avgFillRate = totalCapacity > 0 ? Math.round((totalEnrolled / totalCapacity) * 100) : 0;
        const avgClassSize = total > 0 ? Math.round(totalEnrolled / total) : 0;

        // Classes needing attention
        const lowEnrollment = data.filter(c => {
            const fillRate = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
            return c.status === 'upcoming' && fillRate < 0.3;
        });

        const nearStartDate = data.filter(c => {
            if (c.status !== 'upcoming') return false;
            const startDate = new Date(c.start_date);
            const today = new Date();
            const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));
            return daysUntil >= 0 && daysUntil <= 7;
        });

        // Distribution by course
        const byCourse = courses.map(course => ({
            name: course.title,
            value: data.filter(c => c.courses?.id === course.id).length
        })).filter(c => c.value > 0).sort((a, b) => b.value - a.value);

        // Top teachers by class count
        const teacherCounts = {};
        data.forEach(c => {
            if (c.teacher?.full_name) {
                teacherCounts[c.teacher.full_name] = (teacherCounts[c.teacher.full_name] || 0) + 1;
            }
        });
        const topTeachers = Object.entries(teacherCounts)
            .map(([label, value]) => ({ label, value }))
            .sort((a, b) => b.value - a.value)
            .slice(0, 5);

        // Monthly creation trend (last 6 months)
        const monthlyTrend = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            const year = date.getFullYear();
            const month = date.getMonth();

            const count = data.filter(c => {
                const created = new Date(c.created_at);
                return created.getFullYear() === year && created.getMonth() === month;
            }).length;

            monthlyTrend.push({
                label: `T${month + 1}`,
                month: `Tháng ${month + 1}`,
                count
            });
        }

        // Capacity distribution
        const capacityDistribution = [
            {
                name: 'Đã đầy (>90%)', value: data.filter(c => {
                    const fill = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
                    return fill >= 0.9;
                }).length
            },
            {
                name: 'Gần đầy (60-90%)', value: data.filter(c => {
                    const fill = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
                    return fill >= 0.6 && fill < 0.9;
                }).length
            },
            {
                name: 'Trung bình (30-60%)', value: data.filter(c => {
                    const fill = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
                    return fill >= 0.3 && fill < 0.6;
                }).length
            },
            {
                name: 'Ít (<30%)', value: data.filter(c => {
                    const fill = c.max_students > 0 ? (c.enrolled_count / c.max_students) : 0;
                    return fill < 0.3;
                }).length
            }
        ].filter(d => d.value > 0);

        return {
            total,
            byStatus,
            totalCapacity,
            totalEnrolled,
            avgFillRate,
            avgClassSize,
            lowEnrollment,
            nearStartDate,
            byCourse,
            topTeachers,
            monthlyTrend,
            capacityDistribution
        };
    }, [filteredClasses, courses]);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-96">
                <div className="text-center">
                    <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mx-auto mb-3" />
                    <p className="text-slate-500">Đang tải dữ liệu phân tích...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link to="/admin/classes">
                        <Button variant="ghost" size="icon">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                    </Link>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Phân tích Lớp học</h1>
                        <p className="text-muted-foreground">
                            Tổng quan và insights về {analytics.total} lớp học
                        </p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    {centers.length > 1 && (
                        <select
                            value={selectedCenter}
                            onChange={(e) => setSelectedCenter(e.target.value)}
                            className="h-10 px-3 rounded-lg border border-slate-200 bg-white text-sm"
                        >
                            <option value="">Tất cả trung tâm</option>
                            {centers.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    )}

                    {/* Auto-refresh toggle */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 rounded-lg text-sm">
                        <label className="flex items-center gap-2 cursor-pointer">
                            <input
                                type="checkbox"
                                checked={autoRefreshEnabled}
                                onChange={(e) => setAutoRefreshEnabled(e.target.checked)}
                                className="w-4 h-4 text-indigo-600 rounded"
                            />
                            <span className="text-slate-600">Tự động làm mới</span>
                        </label>
                        {autoRefreshEnabled && (
                            <span className="text-xs text-slate-400">
                                ({lastRefresh.toLocaleTimeString('vi-VN')})
                            </span>
                        )}
                    </div>

                    <Button variant="outline" onClick={handleRefresh} disabled={refreshing}>
                        <RefreshCw className={`w-4 h-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                        Làm mới
                    </Button>
                    <Button variant="outline" onClick={handleExportPDF} disabled={refreshing}>
                        <Download className="w-4 h-4 mr-2" />
                        Xuất PDF
                    </Button>
                </div>
            </div>

            {/* Content wrapper for PDF export */}
            <div id="analytics-content">
                {/* KPI Cards */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <KPICard
                        title="Tổng số lớp"
                        value={analytics.total}
                        icon={<BookOpen className="w-5 h-5" />}
                        trend={null}
                        color="indigo"
                    />
                    <KPICard
                        title="Tổng học viên"
                        value={analytics.totalEnrolled}
                        subtitle={`/ ${analytics.totalCapacity} sức chứa`}
                        icon={<Users className="w-5 h-5" />}
                        trend={null}
                        color="emerald"
                    />
                    <KPICard
                        title="Tỷ lệ lấp đầy"
                        value={`${analytics.avgFillRate}%`}
                        icon={<TrendingUp className="w-5 h-5" />}
                        trend={analytics.avgFillRate >= 70 ? 'up' : analytics.avgFillRate >= 50 ? 'neutral' : 'down'}
                        color="amber"
                    />
                    <KPICard
                        title="Đang học"
                        value={analytics.byStatus.ongoing}
                        subtitle={`${analytics.byStatus.upcoming} sắp mở`}
                        icon={<Calendar className="w-5 h-5" />}
                        trend={null}
                        color="blue"
                    />
                </div>

                {/* Status Overview */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-lg">Trạng thái lớp học</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-4 gap-4">
                            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                                <div key={key} className="text-center p-4 rounded-lg bg-slate-50">
                                    <div className={`w-3 h-3 rounded-full ${config.color} mx-auto mb-2`} />
                                    <div className="text-2xl font-bold">{analytics.byStatus[key]}</div>
                                    <div className="text-sm text-slate-500">{config.label}</div>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Monthly Trend */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Xu hướng tạo lớp</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SimpleAreaChart
                                data={analytics.monthlyTrend}
                                dataKey="count"
                                height={250}
                            />
                        </CardContent>
                    </Card>

                    {/* Distribution by Course */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Phân bố theo khóa học</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SimplePieChart data={analytics.byCourse} />
                        </CardContent>
                    </Card>
                </div>

                {/* Second Charts Row */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Top Teachers */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Top giáo viên theo số lớp</CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analytics.topTeachers.length > 0 ? (
                                <HorizontalBarChart
                                    data={analytics.topTeachers}
                                    showValue
                                    barHeight={8}
                                />
                            ) : (
                                <div className="text-center py-8 text-slate-500">
                                    Chưa có dữ liệu
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Capacity Distribution */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="text-lg">Phân bố sức chứa</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <SimplePieChart data={analytics.capacityDistribution} />
                        </CardContent>
                    </Card>
                </div>

                {/* Alerts Section */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Low Enrollment Alert */}
                    <Card className="border-amber-200 bg-amber-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-amber-500" />
                                Lớp cần chú ý ({analytics.lowEnrollment.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analytics.lowEnrollment.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {analytics.lowEnrollment.slice(0, 5).map(cls => (
                                        <Link
                                            key={cls.id}
                                            to={`/admin/classes/${cls.id}`}
                                            className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-amber-100 transition-colors"
                                        >
                                            <div>
                                                <p className="font-medium text-sm">{cls.name}</p>
                                                <p className="text-xs text-slate-500">{cls.courses?.title}</p>
                                            </div>
                                            <div className="text-right">
                                                <p className="font-medium text-amber-600">
                                                    {cls.enrolled_count}/{cls.max_students}
                                                </p>
                                                <p className="text-xs text-slate-500">học viên</p>
                                            </div>
                                        </Link>
                                    ))}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-slate-500">
                                    <CheckCircle className="w-8 h-8 mx-auto mb-2 text-green-500" />
                                    <p>Không có lớp nào cần chú ý</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Near Start Date Alert */}
                    <Card className="border-blue-200 bg-blue-50/50">
                        <CardHeader>
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Clock className="w-5 h-5 text-blue-500" />
                                Sắp khai giảng ({analytics.nearStartDate.length})
                            </CardTitle>
                        </CardHeader>
                        <CardContent>
                            {analytics.nearStartDate.length > 0 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto">
                                    {analytics.nearStartDate.slice(0, 5).map(cls => {
                                        const startDate = new Date(cls.start_date);
                                        const today = new Date();
                                        const daysUntil = Math.ceil((startDate - today) / (1000 * 60 * 60 * 24));

                                        return (
                                            <Link
                                                key={cls.id}
                                                to={`/admin/classes/${cls.id}`}
                                                className="flex items-center justify-between p-3 bg-white rounded-lg hover:bg-blue-100 transition-colors"
                                            >
                                                <div>
                                                    <p className="font-medium text-sm">{cls.name}</p>
                                                    <p className="text-xs text-slate-500">{cls.courses?.title}</p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-medium text-blue-600">
                                                        {daysUntil === 0 ? 'Hôm nay' : `${daysUntil} ngày`}
                                                    </p>
                                                    <p className="text-xs text-slate-500">
                                                        {startDate.toLocaleDateString('vi-VN')}
                                                    </p>
                                                </div>
                                            </Link>
                                        );
                                    })}
                                </div>
                            ) : (
                                <div className="text-center py-4 text-slate-500">
                                    <Calendar className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                                    <p>Không có lớp nào sắp khai giảng</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </div>
            </div> {/* End analytics-content */}
        </div>
    );
}

// KPI Card Component
function KPICard({ title, value, subtitle, icon, trend, color }) {
    const colorMap = {
        indigo: 'bg-indigo-100 text-indigo-600',
        emerald: 'bg-emerald-100 text-emerald-600',
        amber: 'bg-amber-100 text-amber-600',
        blue: 'bg-blue-100 text-blue-600',
    };

    return (
        <Card>
            <CardContent className="p-6">
                <div className="flex items-start justify-between">
                    <div>
                        <p className="text-sm font-medium text-slate-500">{title}</p>
                        <p className="text-3xl font-bold mt-1">{value}</p>
                        {subtitle && (
                            <p className="text-sm text-slate-500 mt-1">{subtitle}</p>
                        )}
                    </div>
                    <div className={`p-3 rounded-lg ${colorMap[color]}`}>
                        {icon}
                    </div>
                </div>
                {trend && (
                    <div className="mt-3">
                        <span className={`text-sm font-medium ${trend === 'up' ? 'text-green-600' :
                            trend === 'down' ? 'text-red-600' :
                                'text-slate-500'
                            }`}>
                            {trend === 'up' ? '↑ Tốt' : trend === 'down' ? '↓ Cần cải thiện' : '→ Ổn định'}
                        </span>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default ClassAnalyticsPage;
