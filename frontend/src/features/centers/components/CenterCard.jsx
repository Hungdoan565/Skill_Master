/**
 * CenterCard Component - Hiển thị card thông tin trung tâm
 */

import React from 'react';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Users,
    Building2,
    GraduationCap,
    BookOpen,
    MoreVertical,
    Edit,
    Trash2,
    RotateCcw,
    UserPlus,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { STATUS_CONFIG, getInitials, getGradient, formatWorkingHours } from '../utils';

export function CenterCard({
    center,
    onEdit,
    onDelete,
    onRestore,
    onAssignManager,
    onViewDetails,
    canManage = false,
    showActions = true
}) {
    const [showMenu, setShowMenu] = React.useState(false);
    const menuRef = React.useRef(null);

    // Close menu khi click outside
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (menuRef.current && !menuRef.current.contains(event.target)) {
                setShowMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const statusConfig = STATUS_CONFIG[center.status] || STATUS_CONFIG.active;
    const isDeleted = center.status === 'inactive';
    const gradient = getGradient(center.name);

    // Tính tổng giờ làm việc hôm nay
    const getTodayHours = () => {
        if (!center.working_hours) return null;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const todayHours = center.working_hours[today];
        if (!todayHours || todayHours.closed) return 'Nghỉ';
        return `${todayHours.open} - ${todayHours.close}`;
    };

    return (
        <Card className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${isDeleted ? 'opacity-60' : ''}`}>
            {/* Header với gradient và logo */}
            <div className={`h-24 ${gradient} relative`}>
                {/* Logo hoặc initials */}
                <div className="absolute -bottom-8 left-4">
                    {center.logo_url ? (
                        <img
                            src={center.logo_url}
                            alt={center.name}
                            className="w-16 h-16 rounded-xl border-4 border-white shadow-md object-cover bg-white"
                        />
                    ) : (
                        <div className="w-16 h-16 rounded-xl border-4 border-white shadow-md bg-white flex items-center justify-center">
                            <span className="text-xl font-bold text-gray-600">
                                {getInitials(center.name)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status badge */}
                <Badge
                    className={`absolute top-3 right-3 ${statusConfig.bg} ${statusConfig.text} border-0`}
                >
                    {statusConfig.label}
                </Badge>

                {/* Action menu */}
                {showActions && canManage && (
                    <div className="absolute top-3 right-20" ref={menuRef}>
                        <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 w-7 p-0 bg-white/80 hover:bg-white"
                            onClick={() => setShowMenu(!showMenu)}
                        >
                            <MoreVertical className="h-4 w-4" />
                        </Button>

                        {showMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border z-50">
                                <div className="py-1">
                                    {onViewDetails && (
                                        <button
                                            onClick={() => { onViewDetails(center); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Eye className="h-4 w-4 text-gray-500" />
                                            Xem chi tiết
                                        </button>
                                    )}
                                    {!isDeleted && onEdit && (
                                        <button
                                            onClick={() => { onEdit(center); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <Edit className="h-4 w-4 text-blue-500" />
                                            Chỉnh sửa
                                        </button>
                                    )}
                                    {!isDeleted && onAssignManager && (
                                        <button
                                            onClick={() => { onAssignManager(center); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-gray-50 flex items-center gap-2"
                                        >
                                            <UserPlus className="h-4 w-4 text-purple-500" />
                                            Gán quản lý
                                        </button>
                                    )}
                                    {!isDeleted && onDelete && (
                                        <button
                                            onClick={() => { onDelete(center); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Xóa trung tâm
                                        </button>
                                    )}
                                    {isDeleted && onRestore && (
                                        <button
                                            onClick={() => { onRestore(center); setShowMenu(false); }}
                                            className="w-full px-4 py-2 text-left text-sm hover:bg-green-50 text-green-600 flex items-center gap-2"
                                        >
                                            <RotateCcw className="h-4 w-4" />
                                            Khôi phục
                                        </button>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            <CardContent className="pt-12 pb-4">
                {/* Tên và mã */}
                <div className="mb-3">
                    <h3 className="font-semibold text-lg text-gray-900 line-clamp-1">
                        {center.name}
                    </h3>
                    {center.code && (
                        <span className="text-sm text-gray-500">#{center.code}</span>
                    )}
                </div>

                {/* Thông tin liên hệ */}
                <div className="space-y-2 text-sm">
                    {center.address && (
                        <div className="flex items-start gap-2 text-gray-600">
                            <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0 text-gray-400" />
                            <span className="line-clamp-2">{center.address}</span>
                        </div>
                    )}
                    {center.hotline && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Phone className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span>{center.hotline}</span>
                        </div>
                    )}
                    {center.email && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span className="truncate">{center.email}</span>
                        </div>
                    )}
                    {getTodayHours() && (
                        <div className="flex items-center gap-2 text-gray-600">
                            <Clock className="h-4 w-4 flex-shrink-0 text-gray-400" />
                            <span>Hôm nay: {getTodayHours()}</span>
                        </div>
                    )}
                </div>

                {/* Stats */}
                {(center.rooms_count !== undefined || center.teachers_count !== undefined || center.students_count !== undefined) && (
                    <div className="mt-4 pt-4 border-t grid grid-cols-3 gap-2">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Building2 className="h-4 w-4 text-blue-500" />
                                <span className="font-semibold">{center.rooms_count || 0}</span>
                            </div>
                            <span className="text-xs text-gray-500">Phòng</span>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <Users className="h-4 w-4 text-green-500" />
                                <span className="font-semibold">{center.teachers_count || 0}</span>
                            </div>
                            <span className="text-xs text-gray-500">Giáo viên</span>
                        </div>
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1">
                                <GraduationCap className="h-4 w-4 text-purple-500" />
                                <span className="font-semibold">{center.students_count || 0}</span>
                            </div>
                            <span className="text-xs text-gray-500">Học sinh</span>
                        </div>
                    </div>
                )}

                {/* Manager info */}
                {center.manager && (
                    <div className="mt-3 pt-3 border-t">
                        <div className="flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                                {center.manager.avatar_url ? (
                                    <img
                                        src={center.manager.avatar_url}
                                        alt={center.manager.full_name}
                                        className="w-8 h-8 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-xs font-medium text-gray-600">
                                        {getInitials(center.manager.full_name)}
                                    </span>
                                )}
                            </div>
                            <div>
                                <p className="text-sm font-medium text-gray-900 line-clamp-1">
                                    {center.manager.full_name}
                                </p>
                                <p className="text-xs text-gray-500">Quản lý</p>
                            </div>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

export default CenterCard;
