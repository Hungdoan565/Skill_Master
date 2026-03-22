/**
 * StaffDetailModal Component
 * Modal hiển thị chi tiết nhân viên với thống kê
 */

import {
    X, Mail, Phone, Building2, Calendar, Clock,
    BookOpen, DollarSign, TrendingUp, Award
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ColorAvatar } from './ColorAvatar';
import { RoleBadge } from './RoleBadge';
import { formatDate } from '../utils';

export function StaffDetailModal({
    isOpen,
    onClose,
    staff,
    loading = false,
}) {
    if (!isOpen) return null;

    // Format currency
    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('vi-VN').format(amount || 0);
    };

    return (
        <div className="fixed inset-0 z-[300] flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm dark:bg-black/80"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative m-4 max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-xl border border-border bg-card text-foreground shadow-xl">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                    <X className="h-5 w-5" />
                </button>

                {loading ? (
                    <div className="flex items-center justify-center h-64">
                        <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent" />
                    </div>
                ) : staff ? (
                    <>
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-8 text-white">
                            <div className="flex items-center gap-4">
                                <ColorAvatar
                                    name={staff.full_name}
                                    avatarUrl={staff.avatar_url}
                                    size="lg"
                                />
                                <div>
                                    <h2 className="text-2xl font-bold">{staff.full_name}</h2>
                                    <div className="flex items-center gap-2 mt-1">
                                        <RoleBadge roleCode={staff.roles?.code} variant="light" />
                                        <Badge variant={staff.status === 'active' ? 'success' : 'secondary'}>
                                            {staff.status === 'active' ? 'Hoạt động' : 'Ngừng'}
                                        </Badge>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Content */}
                        <div className="p-6 space-y-6">
                            {/* Contact Info */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    <Mail className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Email</p>
                                        <p className="font-medium">{staff.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    <Phone className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Số điện thoại</p>
                                        <p className="font-medium">{staff.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    <Building2 className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Trung tâm</p>
                                        <p className="font-medium">{staff.centers?.name || 'Chưa gán'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3">
                                    <Calendar className="h-5 w-5 text-muted-foreground" />
                                    <div>
                                        <p className="text-xs text-muted-foreground">Ngày tham gia</p>
                                        <p className="font-medium">{formatDate(staff.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hourly Rate (cho Teacher) */}
                            {staff.roles?.code === 'TEACHER' && (
                                <div className="flex items-center gap-3 rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                                    <DollarSign className="h-6 w-6 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-emerald-700 dark:text-emerald-300">Mức lương theo giờ</p>
                                        <p className="text-xl font-bold text-emerald-800 dark:text-emerald-200">
                                            {formatCurrency(staff.hourly_rate)} VNĐ/giờ
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Teaching Stats (cho Teacher) */}
                            {staff.teachingStats && (
                                <div className="space-y-4">
                                    <h3 className="flex items-center gap-2 font-semibold text-foreground">
                                        <TrendingUp className="h-5 w-5 text-indigo-600" />
                                        Thống kê giảng dạy
                                    </h3>

                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                                        <StatBox
                                            icon={BookOpen}
                                            label="Lớp đang dạy"
                                            value={staff.teachingStats.activeClasses}
                                            color="blue"
                                        />
                                        <StatBox
                                            icon={Clock}
                                            label="Buổi tháng này"
                                            value={staff.teachingStats.sessionsThisMonth}
                                            color="purple"
                                        />
                                        <StatBox
                                            icon={TrendingUp}
                                            label="Giờ tháng này"
                                            value={`${staff.teachingStats.totalHoursThisMonth}h`}
                                            color="emerald"
                                        />
                                        <StatBox
                                            icon={Award}
                                            label="Tổng buổi dạy"
                                            value={staff.teachingStats.totalSessionsAllTime}
                                            color="amber"
                                        />
                                    </div>

                                    {/* Estimated earnings this month */}
                                    {staff.teachingStats.totalEarningsThisMonth > 0 && (
                                        <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 p-4">
                                            <p className="text-sm text-emerald-700 dark:text-emerald-300">Ước tính thu nhập tháng này</p>
                                            <p className="text-2xl font-bold text-emerald-800 dark:text-emerald-200">
                                                {formatCurrency(staff.teachingStats.totalEarningsThisMonth)} VNĐ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="flex justify-end border-t border-border bg-muted/20 px-6 py-4">
                            <Button variant="outline" onClick={onClose}>
                                Đóng
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-muted-foreground">
                        Không tìm thấy thông tin nhân viên
                    </div>
                )}
            </div>
        </div>
    );
}

// Sub-component: StatBox
function StatBox({ icon: Icon, label, value, color = 'blue' }) {
    const colors = {
        blue: 'bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-500/20',
        purple: 'bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-500/20',
        emerald: 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-500/20',
        amber: 'bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-500/20',
    };

    return (
        <div className={`p-3 rounded-lg border ${colors[color]}`}>
            <Icon className="h-5 w-5 mb-1 opacity-70" />
            <p className="text-xs opacity-80">{label}</p>
            <p className="text-lg font-bold">{value}</p>
        </div>
    );
}

export default StaffDetailModal;
