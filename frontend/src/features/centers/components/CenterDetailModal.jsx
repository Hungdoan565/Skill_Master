/**
 * CenterDetailModal Component - Modal xem chi tiết trung tâm
 */

import React, { useEffect, useState } from 'react';
import {
    X,
    Building2,
    MapPin,
    Phone,
    Mail,
    Clock,
    User,
    Users,
    GraduationCap,
    BookOpen,
    DollarSign,
    Calendar,
    Edit,
    UserPlus,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { useCenterStats } from '../hooks';
import { STATUS_CONFIG, DAY_LABELS, getInitials, getGradient, formatWorkingHours, formatDate } from '../utils';

export function CenterDetailModal({
    isOpen,
    onClose,
    center,
    onEdit,
    onAssignManager,
    canManage = false
}) {
    const { stats, loading: loadingStats, fetchStats } = useCenterStats(center?.id);

    useEffect(() => {
        if (isOpen && center?.id) {
            fetchStats();
        }
    }, [isOpen, center?.id, fetchStats]);

    if (!isOpen || !center) return null;

    const statusConfig = STATUS_CONFIG[center.status] || STATUS_CONFIG.active;
    const gradient = getGradient(center.name);

    return (
        <div className="fixed inset-0 z-[300] overflow-y-auto">
            {/* Backdrop */}
            <div
                className="fixed inset-0 bg-black/50 transition-opacity"
                onClick={onClose}
            />

            {/* Modal */}
            <div className="flex min-h-full items-center justify-center p-4">
                <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl w-full max-w-3xl max-h-[90vh] overflow-hidden">
                    {/* Header với gradient */}
                    <div className={`h-32 ${gradient} relative`}>
                        <button
                            onClick={onClose}
                            className="absolute top-4 right-4 p-2 bg-white/80 hover:bg-white dark:bg-black/30 dark:hover:bg-black/50 rounded-lg transition-colors"
                        >
                            <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
                        </button>

                        {/* Logo */}
                        <div className="absolute -bottom-10 left-6">
                            {center.logo_url ? (
                                <img
                                    src={center.logo_url}
                                    alt={center.name}
                                    className="w-20 h-20 rounded-xl border-4 border-white dark:border-zinc-900 shadow-lg object-cover bg-white dark:bg-zinc-900"
                                />
                            ) : (
                                <div className="w-20 h-20 rounded-xl border-4 border-white dark:border-zinc-900 shadow-lg bg-white dark:bg-zinc-900 flex items-center justify-center">
                                    <span className="text-2xl font-bold text-muted-foreground">
                                        {getInitials(center.name)}
                                    </span>
                                </div>
                            )}
                        </div>

                        {/* Status & actions */}
                        <div className="absolute bottom-4 right-6 flex items-center gap-2">
                            <Badge className={`${statusConfig.bg} ${statusConfig.text} border-0`}>
                                {statusConfig.label}
                            </Badge>
                            {canManage && (
                                <>
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => onAssignManager?.(center)}
                                        className="bg-white/90 hover:bg-white"
                                    >
                                        <UserPlus className="h-4 w-4 mr-1" />
                                        Gán quản lý
                                    </Button>
                                    <Button
                                        size="sm"
                                        onClick={() => onEdit?.(center)}
                                        className="bg-white/90 hover:bg-white text-gray-700"
                                    >
                                        <Edit className="h-4 w-4 mr-1" />
                                        Chỉnh sửa
                                    </Button>
                                </>
                            )}
                        </div>
                    </div>

                    {/* Body */}
                    <div className="pt-14 pb-6 px-6 overflow-y-auto max-h-[calc(90vh-128px)]">
                        {/* Title */}
                        <div className="mb-6">
                            <h2 className="text-2xl font-bold text-foreground">{center.name}</h2>
                            {center.code && (
                                <span className="text-sm text-muted-foreground">Mã: #{center.code}</span>
                            )}
                            {center.description && (
                                <p className="mt-2 text-muted-foreground">{center.description}</p>
                            )}
                        </div>

                        {/* Stats cards */}
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                            <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <Building2 className="h-6 w-6 text-blue-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">
                                    {loadingStats ? '-' : (stats?.rooms?.total || center.rooms_count || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Phòng học</p>
                            </Card>
                            <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <BookOpen className="h-6 w-6 text-green-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">
                                    {loadingStats ? '-' : (stats?.classes?.total || center.classes_count || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Lớp học</p>
                            </Card>
                            <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <Users className="h-6 w-6 text-purple-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">
                                    {loadingStats ? '-' : (stats?.teachers?.total || center.teachers_count || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Giáo viên</p>
                            </Card>
                            <Card className="p-4 text-center bg-white dark:bg-zinc-900 border-gray-200 dark:border-zinc-800">
                                <GraduationCap className="h-6 w-6 text-amber-500 mx-auto mb-2" />
                                <p className="text-2xl font-bold text-foreground">
                                    {loadingStats ? '-' : (stats?.students?.total || center.students_count || 0)}
                                </p>
                                <p className="text-sm text-muted-foreground">Học sinh</p>
                            </Card>
                        </div>

                        {/* Contact info */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <MapPin className="h-4 w-4 text-muted-foreground" />
                                    Thông tin liên hệ
                                </h3>
                                <div className="space-y-3 text-sm">
                                    {center.address && (
                                        <div className="flex items-start gap-3">
                                            <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                                            <span className="text-muted-foreground">{center.address}</span>
                                        </div>
                                    )}
                                    {center.hotline && (
                                        <div className="flex items-center gap-3">
                                            <Phone className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <a href={`tel:${center.hotline}`} className="text-indigo-600 hover:underline">
                                                {center.hotline}
                                            </a>
                                        </div>
                                    )}
                                    {center.email && (
                                        <div className="flex items-center gap-3">
                                            <Mail className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                                            <a href={`mailto:${center.email}`} className="text-indigo-600 hover:underline">
                                                {center.email}
                                            </a>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Manager */}
                            <div>
                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <User className="h-4 w-4 text-muted-foreground" />
                                    Quản lý trung tâm
                                </h3>
                                {center.manager ? (
                                    <div className="flex items-center gap-3 p-3 bg-gray-100 dark:bg-zinc-800 rounded-lg">
                                        <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                                            {center.manager.avatar_url ? (
                                                <img
                                                    src={center.manager.avatar_url}
                                                    alt={center.manager.full_name}
                                                    className="w-full h-full object-cover"
                                                />
                                            ) : (
                                                <span className="text-lg font-medium text-muted-foreground">
                                                    {getInitials(center.manager.full_name)}
                                                </span>
                                            )}
                                        </div>
                                        <div>
                                            <p className="font-medium text-foreground">{center.manager.full_name}</p>
                                            {center.manager.email && (
                                                <p className="text-sm text-muted-foreground">{center.manager.email}</p>
                                            )}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-100 dark:bg-zinc-800 rounded-lg text-center">
                                        <User className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                                        <p className="text-muted-foreground text-sm">Chưa có quản lý</p>
                                        {canManage && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => onAssignManager?.(center)}
                                                className="mt-2"
                                            >
                                                <UserPlus className="h-4 w-4 mr-1" />
                                                Gán quản lý
                                            </Button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Working hours */}
                        {center.working_hours && (
                            <div className="mb-6">
                                <h3 className="text-sm font-semibold text-foreground mb-3 flex items-center gap-2">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    Giờ làm việc
                                </h3>
                                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                                    {Object.entries(DAY_LABELS).map(([key, label]) => {
                                        const hours = center.working_hours[key];
                                        const isClosed = !hours || hours.closed;
                                        return (
                                            <div
                                                key={key}
                                                className={`p-2 rounded-lg text-center ${isClosed ? 'bg-muted text-muted-foreground' : 'bg-indigo-50 dark:bg-indigo-900/30'}`}
                                            >
                                                <p className="text-xs font-medium">{label}</p>
                                                <p className={`text-sm ${isClosed ? '' : 'text-indigo-700 dark:text-indigo-300 font-medium'}`}>
                                                    {isClosed ? 'Nghỉ' : `${hours.open} - ${hours.close}`}
                                                </p>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Timestamps */}
                        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-4 border-t border-gray-200 dark:border-zinc-800">
                            <span className="flex items-center gap-1">
                                <Calendar className="h-3 w-3" />
                                Tạo: {formatDate(center.created_at)}
                            </span>
                            {center.updated_at && (
                                <span className="flex items-center gap-1">
                                    <Calendar className="h-3 w-3" />
                                    Cập nhật: {formatDate(center.updated_at)}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CenterDetailModal;
