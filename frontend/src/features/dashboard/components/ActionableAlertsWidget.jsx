/**
 * ActionableAlertsWidget - Widget hiển thị alerts có thể thao tác
 * 
 * Features:
 * - Hiển thị overdue invoices, missing schedules, pending certificates
 * - CTAs link đến trang relevant
 * - Badge count cho mỗi loại alert
 * - Collapsible sections
 */

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/lib/supabaseClient';
import {
    AlertCircle,
    TrendingDown,
    Calendar,
    Award,
    FileText,
    ChevronDown,
    ChevronRight,
    ExternalLink,
    Loader2,
    AlertTriangle,
    Clock,
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

// Alert type configurations
const ALERT_CONFIG = {
    overdue_invoices: {
        icon: TrendingDown,
        color: 'text-red-600',
        bgColor: 'bg-red-500/10',
        borderColor: 'border-red-500/20',
        title: 'Hóa đơn quá hạn',
        emptyMessage: 'Không có hóa đơn quá hạn',
    },
    classes_missing_schedule: {
        icon: Calendar,
        color: 'text-amber-600',
        bgColor: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        title: 'Lớp thiếu lịch học',
        emptyMessage: 'Tất cả lớp đã có lịch',
    },
    certificates_pending: {
        icon: Award,
        color: 'text-blue-600',
        bgColor: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        title: 'Chứng chỉ chờ cấp',
        emptyMessage: 'Không có chứng chỉ chờ cấp',
    },
    draft_invoices: {
        icon: FileText,
        color: 'text-purple-600',
        bgColor: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        title: 'Hóa đơn draft lâu',
        emptyMessage: 'Không có hóa đơn draft',
    },
};

// Individual Alert Item Component
const AlertItem = ({ type, item }) => {
    if (type === 'overdue_invoices') {
        return (
            <Link
                to={`/admin/invoices?highlight=${item.invoice_id}`}
                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                        {item.student_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">#{item.invoice_number}</span>
                        <span className="text-sm text-red-600 font-semibold">
                            {item.amount?.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Quá hạn {item.days_overdue} ngày
                    </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 flex-shrink-0" />
            </Link>
        );
    }

    if (type === 'classes_missing_schedule') {
        return (
            <Link
                to={`/admin/classes/${item.class_id}`}
                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                        {item.class_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{item.course_name}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                        Bắt đầu: {new Date(item.start_date).toLocaleDateString('vi-VN')}
                    </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 flex-shrink-0" />
            </Link>
        );
    }

    if (type === 'certificates_pending') {
        return (
            <Link
                to={`/admin/certificates?highlight=${item.certificate_id}`}
                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                        {item.student_name}
                    </p>
                    <p className="text-sm text-muted-foreground truncate">{item.certificate_type_name}</p>
                    <div className="flex items-center gap-3 mt-1 text-xs text-muted-foreground">
                        <span>#{item.certificate_number}</span>
                        <span>{item.class_name}</span>
                        <span>Yêu cầu: {new Date(item.requested_at).toLocaleDateString('vi-VN')}</span>
                    </div>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 flex-shrink-0" />
            </Link>
        );
    }

    if (type === 'draft_invoices') {
        return (
            <Link
                to={`/admin/invoices?highlight=${item.invoice_id}`}
                className="flex items-center justify-between p-3 hover:bg-muted rounded-lg transition-colors group"
            >
                <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                        {item.student_name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-muted-foreground">#{item.invoice_number}</span>
                        <span className="text-sm text-purple-600 font-semibold">
                            {item.amount?.toLocaleString('vi-VN')}đ
                        </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                        Draft {item.days_in_draft} ngày
                    </p>
                </div>
                <ExternalLink className="h-4 w-4 text-muted-foreground group-hover:text-indigo-600 flex-shrink-0" />
            </Link>
        );
    }

    return null;
};

// Alert Section Component
const AlertSection = ({ type, config, data }) => {
    const [expanded, setExpanded] = useState(true);
    const Icon = config.icon;
    const items = data || [];
    const hasItems = items.length > 0;

    return (
        <div className={`border rounded-lg ${hasItems ? config.borderColor : 'border-border'}`}>
            {/* Header */}
            <button
                onClick={() => setExpanded(!expanded)}
                className={`w-full flex items-center justify-between p-4 ${hasItems ? config.bgColor : 'bg-muted'
                    } rounded-t-lg hover:opacity-90 transition-opacity`}
            >
                <div className="flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${hasItems ? config.color : 'text-muted-foreground'}`} />
                    <span className={`font-semibold ${hasItems ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {config.title}
                    </span>
                    {hasItems && (
                        <Badge variant="secondary" className={`${config.color} bg-background`}>
                            {items.length}
                        </Badge>
                    )}
                </div>
                {hasItems ? (
                    expanded ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                    ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                    )
                ) : (
                    <span className="text-sm text-muted-foreground">{config.emptyMessage}</span>
                )}
            </button>

            {/* Content */}
            {expanded && hasItems && (
                <div className="divide-y divide-border">
                    {items.slice(0, 5).map((item, idx) => (
                        <AlertItem key={idx} type={type} item={item} />
                    ))}
                    {items.length > 5 && (
                        <div className="p-3 text-center">
                            <span className="text-sm text-muted-foreground">
                                +{items.length - 5} mục khác
                            </span>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

// Main Widget Component
export const ActionableAlertsWidget = ({ centerId }) => {
    const [alerts, setAlerts] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        fetchAlerts();
    }, [centerId]);

    const fetchAlerts = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session?.access_token) throw new Error('Chưa đăng nhập');

            const url = centerId
                ? `${API_URL}/api/dashboard/alerts?centerId=${centerId}`
                : `${API_URL}/api/dashboard/alerts`;

            const response = await fetch(url, {
                headers: {
                    'Authorization': `Bearer ${session.access_token}`,
                    'Content-Type': 'application/json',
                },
            });

            const data = await response.json();

            if (data.success) {
                setAlerts(data.data.alerts);
            } else {
                setError(data.message || 'Không thể tải alerts');
            }
        } catch (err) {
            console.error('Error fetching alerts:', err);
            setError('Lỗi khi tải alerts');
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Cần xử lý
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center py-8 text-muted-foreground">
                        <Loader2 className="h-6 w-6 animate-spin mr-2" />
                        <span>Đang tải...</span>
                    </div>
                </CardContent>
            </Card>
        );
    }

    if (error) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Cần xử lý
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
                        <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
                        <p className="text-sm text-red-700 dark:text-red-400">{error}</p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    const totalAlerts = alerts ? Object.keys(alerts).reduce((sum, key) => {
        const data = alerts[key]?.data || [];
        return sum + (Array.isArray(data) ? data.length : 0);
    }, 0) : 0;

    return (
        <Card>
            <CardHeader>
                <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                        <AlertCircle className="h-5 w-5" />
                        Cần xử lý
                    </CardTitle>
                    {totalAlerts > 0 && (
                        <Badge variant="destructive" className="text-base px-3 py-1">
                            {totalAlerts}
                        </Badge>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {totalAlerts === 0 ? (
                    <div className="text-center py-8">
                        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-green-100 dark:bg-green-900/30 mb-3">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-foreground font-medium">Tất cả đã xử lý!</p>
                        <p className="text-sm text-muted-foreground mt-1">Không có vấn đề cần chú ý</p>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {alerts && Object.entries(ALERT_CONFIG).map(([type, config]) => (
                            <AlertSection
                                key={type}
                                type={type}
                                config={config}
                                data={alerts[type]?.data}
                            />
                        ))}
                    </div>
                )}
            </CardContent>
        </Card>
    );
};
