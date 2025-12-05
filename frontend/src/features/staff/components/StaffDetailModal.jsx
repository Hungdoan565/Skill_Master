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
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="relative bg-white rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto m-4">
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors z-10"
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
                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Mail className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Email</p>
                                        <p className="font-medium">{staff.email}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Phone className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Số điện thoại</p>
                                        <p className="font-medium">{staff.phone || 'Chưa cập nhật'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Building2 className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Trung tâm</p>
                                        <p className="font-medium">{staff.centers?.name || 'Chưa gán'}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-3 p-3 rounded-lg bg-slate-50">
                                    <Calendar className="h-5 w-5 text-slate-400" />
                                    <div>
                                        <p className="text-xs text-slate-500">Ngày tham gia</p>
                                        <p className="font-medium">{formatDate(staff.created_at)}</p>
                                    </div>
                                </div>
                            </div>

                            {/* Hourly Rate (cho Teacher) */}
                            {staff.roles?.code === 'TEACHER' && (
                                <div className="flex items-center gap-3 p-4 rounded-lg bg-emerald-50 border border-emerald-200">
                                    <DollarSign className="h-6 w-6 text-emerald-600" />
                                    <div>
                                        <p className="text-sm text-emerald-700">Mức lương theo giờ</p>
                                        <p className="text-xl font-bold text-emerald-800">
                                            {formatCurrency(staff.hourly_rate)} VNĐ/giờ
                                        </p>
                                    </div>
                                </div>
                            )}

                            {/* Teaching Stats (cho Teacher) */}
                            {staff.teachingStats && (
                                <div className="space-y-4">
                                    <h3 className="font-semibold text-slate-800 flex items-center gap-2">
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
                                        <div className="p-4 rounded-lg bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200">
                                            <p className="text-sm text-emerald-700">Ước tính thu nhập tháng này</p>
                                            <p className="text-2xl font-bold text-emerald-800">
                                                {formatCurrency(staff.teachingStats.totalEarningsThisMonth)} VNĐ
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="px-6 py-4 bg-slate-50 border-t flex justify-end">
                            <Button variant="outline" onClick={onClose}>
                                Đóng
                            </Button>
                        </div>
                    </>
                ) : (
                    <div className="p-8 text-center text-slate-500">
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
        blue: 'bg-blue-50 text-blue-700 border-blue-200',
        purple: 'bg-purple-50 text-purple-700 border-purple-200',
        emerald: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        amber: 'bg-amber-50 text-amber-700 border-amber-200',
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
