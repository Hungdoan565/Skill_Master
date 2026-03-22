/**
 * CenterOverviewTab Component - Tab tổng quan
 */

import React from 'react';
import {
    Building2,
    BookOpen,
    Users,
    GraduationCap,
    Clock,
    Calendar,
    TrendingUp,
    CheckCircle,
    AlertCircle,
    MapPin,
    Phone,
    Mail
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { DAY_LABELS, formatDate, getInitials } from '../utils';

export function CenterOverviewTab({ center, stats, manager, loading = false }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {[1, 2].map(i => (
                        <Card key={i} className="p-6 animate-pulse border-border shadow-sm">
                            <div className="h-5 w-32 bg-muted rounded mb-4" />
                            <div className="space-y-3">
                                <div className="h-16 bg-muted rounded w-full" />
                            </div>
                        </Card>
                    ))}
                </div>
                <div className="space-y-6">
                    <Card className="p-6 animate-pulse border-border shadow-sm">
                        <div className="h-5 w-32 bg-muted rounded mb-4" />
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-muted" />
                            <div className="space-y-2 flex-1">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                            </div>
                        </div>
                    </Card>
                </div>
            </div>
        );
    }

    // Default to center.manager if manager prop is missing but exists on center
    const activeManager = manager || center?.manager;

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content - Lottie & Working Hours */}
            <div className="lg:col-span-2 space-y-6">
                {/* Working hours */}
                {center?.working_hours && (
                    <Card className="p-5 sm:p-6 shadow-sm border-border">
                        <div className="flex items-center gap-2 mb-5">
                            <div className="p-2 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 rounded-lg">
                                <Clock className="h-4 w-4" />
                            </div>
                            <h3 className="text-base font-semibold text-foreground">Giờ làm việc</h3>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
                            {Object.entries(DAY_LABELS).map(([key, label]) => {
                                const hours = center.working_hours[key];
                                const isClosed = !hours || hours.closed;
                                const isToday = isCurrentDay(key);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 rounded-xl text-center transition-all border
                                            ${isClosed
                                                ? 'bg-muted/50 border-border text-muted-foreground opacity-60'
                                                : isToday
                                                    ? 'bg-indigo-50/50 dark:bg-indigo-900/20 border-indigo-200 dark:border-indigo-700 ring-1 ring-indigo-500 shadow-sm'
                                                    : 'bg-card border-border hover:border-border'
                                            }
                                        `}
                                    >
                                        <p className={`text-xs font-semibold mb-1 ${isToday ? 'text-indigo-700 dark:text-indigo-400' : 'text-muted-foreground'}`}>
                                            {label}
                                        </p>
                                        <p className={`text-sm font-medium ${isClosed ? 'text-muted-foreground' : isToday ? 'text-indigo-700 dark:text-indigo-400' : 'text-foreground'}`}>
                                            {isClosed ? 'Nghỉ' : `${hours.open} - ${hours.close}`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Revenue summary highlights - Mini version instead of full cards */}
                {stats?.revenue && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="p-5 sm:p-6 shadow-sm border-border bg-gradient-to-br from-emerald-50 dark:from-emerald-900/20 to-white dark:to-card">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300 mb-1">Doanh thu tháng này</p>
                                    <p className="text-3xl font-bold text-foreground">
                                        {formatCurrency(stats.revenue.monthly || 0)}
                                    </p>
                                </div>
                                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 rounded-lg">
                                    <TrendingUp className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="flex items-center gap-2 text-sm">
                                <Badge variant="secondary" className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 border-0">
                                    {stats.revenue.invoiceCount || 0} hóa đơn
                                </Badge>
                                <span className="text-muted-foreground">Đã thanh toán</span>
                            </div>
                        </Card>

                        <Card className="p-5 sm:p-6 shadow-sm border-border">
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <p className="text-sm font-medium text-muted-foreground mb-1">Tỷ lệ đăng ký</p>
                                    <div className="flex items-baseline gap-2">
                                        <p className="text-3xl font-bold text-foreground">
                                            {stats?.students?.active || 0}
                                        </p>
                                        <p className="text-sm text-muted-foreground">
                                            / {stats?.students?.total || 0} học viên
                                        </p>
                                    </div>
                                </div>
                                <div className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 rounded-lg">
                                    <Users className="h-5 w-5" />
                                </div>
                            </div>
                            <div className="w-full bg-muted rounded-full h-2 rounded-full overflow-hidden">
                                <div 
                                    className="bg-blue-500 h-2 rounded-full" 
                                    style={{ width: `${(stats?.students?.active / Math.max(stats?.students?.total, 1)) * 100}%` }}
                                ></div>
                            </div>
                        </Card>
                    </div>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Manager card */}
                <Card className="p-5 shadow-sm border-border">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            Quản lý trung tâm
                        </h3>
                    </div>

                    {activeManager ? (
                        <div>
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-12 h-12 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex flex-shrink-0 items-center justify-center overflow-hidden">
                                    {activeManager.avatar_url ? (
                                        <img
                                            src={activeManager.avatar_url}
                                            alt={activeManager.full_name}
                                            className="w-full h-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-lg font-bold text-indigo-600">
                                            {getInitials(activeManager.full_name)}
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="font-semibold text-foreground truncate" title={activeManager.full_name}>
                                        {activeManager.full_name}
                                    </p>
                                    <Badge variant="secondary" className="mt-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-50 border-0 font-normal">
                                        Center Manager
                                    </Badge>
                                </div>
                            </div>

                            <div className="space-y-2 mt-4 pt-4 border-t border-border">
                                {activeManager.email && (
                                    <a href={`mailto:${activeManager.email}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                                        <Mail className="h-4 w-4 text-muted-foreground" />
                                        <span className="truncate">{activeManager.email}</span>
                                    </a>
                                )}
                                {activeManager.phone && (
                                    <a href={`tel:${activeManager.phone}`} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-indigo-600 transition-colors">
                                        <Phone className="h-4 w-4 text-muted-foreground" />
                                        <span>{activeManager.phone}</span>
                                    </a>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-6 px-4 border border-dashed border-border rounded-xl bg-muted/30">
                            <div className="w-10 h-10 rounded-full bg-amber-50 dark:bg-amber-900/30 flex items-center justify-center mx-auto mb-3">
                                <AlertCircle className="h-5 w-5 text-amber-500" />
                            </div>
                            <p className="text-sm font-medium text-foreground mb-1">Chưa có quản lý</p>
                            <p className="text-xs text-muted-foreground text-center max-w-[200px] mx-auto">
                                Cơ sở này hiện chưa được gán quản lý nào.
                            </p>
                        </div>
                    )}
                </Card>

                {/* Quick info */}
                <Card className="p-5 shadow-sm border-border">
                    <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-muted-foreground" />
                        Thông tin hệ thống
                    </h3>
                    <div className="space-y-3.5 text-sm">
                        <InfoRow label="Mã định danh" value={center?.code || '-'} />
                        <InfoRow label="Trạng thái" value={
                            <Badge className={center?.status === 'active'
                                ? 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-0 shadow-none'
                                : 'bg-muted text-muted-foreground border-0 shadow-none'}>
                                {center?.status === 'active' ? 'Hoạt động' : 'Tạm đóng'}
                            </Badge>
                        } />
                        <InfoRow label="Ngày tạo" value={formatDate(center?.created_at)} />
                        {center?.updated_at && (
                            <InfoRow label="Cập nhật gần nhất" value={formatDate(center?.updated_at)} />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center py-1">
            <span className="text-muted-foreground">{label}</span>
            <span className="font-medium text-foreground text-right">{value}</span>
        </div>
    );
}

// Helper functions
function isCurrentDay(dayKey) {
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
    return days[new Date().getDay()] === dayKey;
}

function formatCurrency(amount) {
    return new Intl.NumberFormat('vi-VN', {
        style: 'currency',
        currency: 'VND',
        maximumFractionDigits: 0
    }).format(amount);
}

export default CenterOverviewTab;
