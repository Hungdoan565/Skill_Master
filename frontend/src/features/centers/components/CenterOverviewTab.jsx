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
    AlertCircle
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DAY_LABELS, formatDate, getInitials } from '../utils';

export function CenterOverviewTab({ center, stats, loading = false }) {
    if (loading) {
        return (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                    {[1, 2].map(i => (
                        <Card key={i} className="p-6 animate-pulse">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                            <div className="space-y-3">
                                <div className="h-4 bg-gray-200 rounded w-full" />
                                <div className="h-4 bg-gray-200 rounded w-3/4" />
                            </div>
                        </Card>
                    ))}
                </div>
                <Card className="p-6 animate-pulse">
                    <div className="h-6 w-32 bg-gray-200 rounded mb-4" />
                    <div className="space-y-3">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="h-12 bg-gray-200 rounded" />
                        ))}
                    </div>
                </Card>
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main content */}
            <div className="lg:col-span-2 space-y-6">
                {/* Stats detail cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <StatDetailCard
                        title="Phòng học"
                        icon={Building2}
                        color="blue"
                        items={[
                            { label: 'Hoạt động', value: stats?.rooms?.active || 0 },
                            { label: 'Bảo trì', value: stats?.rooms?.maintenance || 0 },
                            { label: 'Tổng sức chứa', value: stats?.rooms?.totalCapacity || 0 }
                        ]}
                    />
                    <StatDetailCard
                        title="Lớp học"
                        icon={BookOpen}
                        color="green"
                        items={[
                            { label: 'Đang học', value: stats?.classes?.ongoing || 0 },
                            { label: 'Sắp khai giảng', value: stats?.classes?.upcoming || 0 },
                            { label: 'Hoàn thành', value: stats?.classes?.completed || 0 }
                        ]}
                    />
                    <StatDetailCard
                        title="Nhân sự"
                        icon={Users}
                        color="purple"
                        items={[
                            { label: 'Giáo viên', value: stats?.staff?.teachers || 0 },
                            { label: 'Quản lý', value: stats?.staff?.managers || 0 },
                            { label: 'Tổng cộng', value: stats?.staff?.total || 0 }
                        ]}
                    />
                    <StatDetailCard
                        title="Buổi học"
                        icon={Calendar}
                        color="amber"
                        items={[
                            { label: 'Đã hoàn thành', value: stats?.sessions?.completed || 0 },
                            { label: 'Đã lên lịch', value: stats?.sessions?.scheduled || 0 },
                            { label: 'Tổng', value: stats?.sessions?.total || 0 }
                        ]}
                    />
                </div>

                {/* Working hours */}
                {center?.working_hours && (
                    <Card className="p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            Giờ làm việc
                        </h3>
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
                            {Object.entries(DAY_LABELS).map(([key, label]) => {
                                const hours = center.working_hours[key];
                                const isClosed = !hours || hours.closed;
                                const isToday = isCurrentDay(key);

                                return (
                                    <div
                                        key={key}
                                        className={`p-3 rounded-lg text-center transition-all
                                            ${isClosed
                                                ? 'bg-gray-50 text-gray-400'
                                                : isToday
                                                    ? 'bg-indigo-100 ring-2 ring-indigo-500'
                                                    : 'bg-indigo-50'
                                            }
                                        `}
                                    >
                                        <p className={`text-xs font-semibold ${isToday ? 'text-indigo-700' : ''}`}>
                                            {label}
                                        </p>
                                        <p className={`text-sm mt-1 ${isClosed ? '' : 'text-indigo-700 font-medium'}`}>
                                            {isClosed ? 'Nghỉ' : `${hours.open} - ${hours.close}`}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </Card>
                )}

                {/* Revenue summary */}
                {stats?.revenue && (
                    <Card className="p-6">
                        <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <TrendingUp className="h-4 w-4 text-gray-400" />
                            Doanh thu tháng này
                        </h3>
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-3xl font-bold text-gray-900">
                                    {formatCurrency(stats.revenue.monthly || 0)}
                                </p>
                                <p className="text-sm text-gray-500 mt-1">
                                    {stats.revenue.invoiceCount || 0} hóa đơn đã thu
                                </p>
                            </div>
                            <div className="text-right">
                                <Badge className="bg-emerald-100 text-emerald-700">
                                    <TrendingUp className="h-3 w-3 mr-1" />
                                    Đang tốt
                                </Badge>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
                {/* Manager card */}
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Users className="h-4 w-4 text-gray-400" />
                        Quản lý trung tâm
                    </h3>
                    {center?.manager ? (
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                                {center.manager.avatar_url ? (
                                    <img
                                        src={center.manager.avatar_url}
                                        alt={center.manager.full_name}
                                        className="w-full h-full object-cover"
                                    />
                                ) : (
                                    <span className="text-lg font-medium text-gray-600">
                                        {getInitials(center.manager.full_name)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="font-medium text-gray-900">{center.manager.full_name}</p>
                                {center.manager.email && (
                                    <p className="text-sm text-gray-500">{center.manager.email}</p>
                                )}
                                {center.manager.phone && (
                                    <p className="text-sm text-gray-500">{center.manager.phone}</p>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="text-center py-4">
                            <AlertCircle className="h-8 w-8 text-amber-400 mx-auto mb-2" />
                            <p className="text-gray-500 text-sm">Chưa có quản lý</p>
                        </div>
                    )}
                </Card>

                {/* Quick info */}
                <Card className="p-6">
                    <h3 className="text-sm font-semibold text-gray-900 mb-4 flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400" />
                        Thông tin
                    </h3>
                    <div className="space-y-3 text-sm">
                        <InfoRow label="Mã" value={center?.code || '-'} />
                        <InfoRow label="Trạng thái" value={
                            <Badge className={center?.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-gray-100 text-gray-600'}>
                                {center?.status === 'active' ? 'Hoạt động' : 'Tạm đóng'}
                            </Badge>
                        } />
                        <InfoRow label="Ngày tạo" value={formatDate(center?.created_at)} />
                        {center?.updated_at && (
                            <InfoRow label="Cập nhật" value={formatDate(center?.updated_at)} />
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
}

// Helper components
function StatDetailCard({ title, icon: Icon, color, items }) {
    const colorMap = {
        blue: { bg: 'bg-blue-50', text: 'text-blue-600', light: 'text-blue-500' },
        green: { bg: 'bg-green-50', text: 'text-green-600', light: 'text-green-500' },
        purple: { bg: 'bg-purple-50', text: 'text-purple-600', light: 'text-purple-500' },
        amber: { bg: 'bg-amber-50', text: 'text-amber-600', light: 'text-amber-500' }
    };
    const colors = colorMap[color] || colorMap.blue;

    return (
        <Card className="p-4">
            <div className={`inline-flex p-2 rounded-lg ${colors.bg} mb-3`}>
                <Icon className={`h-4 w-4 ${colors.text}`} />
            </div>
            <p className="font-medium text-gray-900 text-sm mb-2">{title}</p>
            <div className="space-y-1">
                {items.map((item, i) => (
                    <div key={i} className="flex justify-between text-xs">
                        <span className="text-gray-500">{item.label}</span>
                        <span className="font-medium text-gray-700">{item.value}</span>
                    </div>
                ))}
            </div>
        </Card>
    );
}

function InfoRow({ label, value }) {
    return (
        <div className="flex justify-between items-center">
            <span className="text-gray-500">{label}</span>
            <span className="font-medium text-gray-900">{value}</span>
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
