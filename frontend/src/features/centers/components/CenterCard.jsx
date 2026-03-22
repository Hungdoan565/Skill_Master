/**
 * CenterCard Component - Hiển thị card thông tin trung tâm
 * Refined design: subtle gradients, compact stats pills, clean spacing
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Users,
    Building2,
    GraduationCap,
    MoreVertical,
    Edit,
    Trash2,
    RotateCcw,
    UserPlus,
    Eye
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { STATUS_CONFIG, getInitials, getGradient } from '../utils';

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
    const navigate = useNavigate();
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

    const handleCardClick = (e) => {
        if (e.target.closest('[data-no-navigate]') || e.target.closest('button')) {
            return;
        }
        navigate(`/admin/centers/${center.id}`);
    };

    const getTodayHours = () => {
        if (!center.working_hours) return null;
        const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
        const today = days[new Date().getDay()];
        const todayHours = center.working_hours[today];
        if (!todayHours || todayHours.closed) return 'Nghỉ';
        return `${todayHours.open} - ${todayHours.close}`;
    };

    const todayHours = getTodayHours();
    const isOpenToday = todayHours && todayHours !== 'Nghỉ';

    return (
        <div
            className={`relative group bg-card rounded-xl border border-border overflow-hidden transition-all duration-300 hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.12)] dark:hover:shadow-[0_8px_30px_-12px_rgba(0,0,0,0.4)] hover:border-border cursor-pointer ${isDeleted ? 'opacity-60 grayscale-[30%]' : ''}`}
            onClick={handleCardClick}
        >
            {/* Compact Header Banner */}
            <div className={`h-16 ${gradient} relative`}>
                {/* Subtle pattern overlay */}
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_30%,rgba(255,255,255,0.08)_0%,transparent_60%)]" />
                
                {/* Logo */}
                <div className="absolute -bottom-6 left-4">
                    {center.logo_url ? (
                        <img
                            src={center.logo_url}
                            alt={center.name}
                            className="w-12 h-12 rounded-lg border-[3px] border-card shadow-sm object-cover bg-card"
                        />
                    ) : (
                        <div className="w-12 h-12 rounded-lg border-[3px] border-card shadow-sm bg-card flex items-center justify-center">
                            <span className="text-sm font-bold text-muted-foreground">
                                {getInitials(center.name)}
                            </span>
                        </div>
                    )}
                </div>

                {/* Status dot + Action menu */}
                <div className="absolute top-2.5 right-3 flex items-center gap-1.5">
                    <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-medium tracking-wide uppercase ${
                        center.status === 'active' 
                            ? 'bg-emerald-400/20 text-emerald-100' 
                            : 'bg-white/15 text-white/70'
                    }`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${center.status === 'active' ? 'bg-emerald-400' : 'bg-white/50'}`} />
                        {statusConfig.label}
                    </div>

                    {showActions && canManage && (
                        <div ref={menuRef} data-no-navigate>
                            <Button
                                variant="ghost"
                                size="sm"
                                className="h-6 w-6 p-0 bg-white/10 hover:bg-white/25 text-white/80"
                                onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu); }}
                            >
                                <MoreVertical className="h-3.5 w-3.5" />
                            </Button>

                            {showMenu && (
                                <div className="absolute right-0 mt-1 w-44 bg-popover rounded-lg shadow-lg dark:shadow-black/30 border border-border z-50 py-1">
                                    {onViewDetails && (
                                        <button
                                            onClick={() => { onViewDetails(center); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                        >
                                            <Eye className="h-3.5 w-3.5 text-muted-foreground" />
                                            Xem chi tiết
                                        </button>
                                    )}
                                    {!isDeleted && onEdit && (
                                        <button
                                            onClick={() => { onEdit(center); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                        >
                                            <Edit className="h-3.5 w-3.5 text-blue-500" />
                                            Chỉnh sửa
                                        </button>
                                    )}
                                    {!isDeleted && onAssignManager && (
                                        <button
                                            onClick={() => { onAssignManager(center); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-muted flex items-center gap-2 text-foreground"
                                        >
                                            <UserPlus className="h-3.5 w-3.5 text-violet-500" />
                                            Gán quản lý
                                        </button>
                                    )}
                                    {!isDeleted && onDelete && (
                                        <button
                                            onClick={() => { onDelete(center); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-red-50 text-red-600 flex items-center gap-2"
                                        >
                                            <Trash2 className="h-3.5 w-3.5" />
                                            Xóa trung tâm
                                        </button>
                                    )}
                                    {isDeleted && onRestore && (
                                        <button
                                            onClick={() => { onRestore(center); setShowMenu(false); }}
                                            className="w-full px-3 py-2 text-left text-sm hover:bg-green-50 text-green-600 flex items-center gap-2"
                                        >
                                            <RotateCcw className="h-3.5 w-3.5" />
                                            Khôi phục
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Content */}
            <div className="px-4 pt-9 pb-4">
                {/* Name + Code */}
                <div className="mb-3">
                    <h3 className="font-semibold text-[15px] text-foreground line-clamp-1 leading-tight">
                        {center.name}
                    </h3>
                    {center.code && (
                        <span className="text-xs text-muted-foreground/60 font-medium">#{center.code}</span>
                    )}
                </div>

                {/* Contact Info - Clean list */}
                <div className="space-y-1.5 text-[13px] text-muted-foreground">
                    {center.address && (
                        <div className="flex items-start gap-2">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-muted-foreground/50" />
                            <span className="line-clamp-1">{center.address}</span>
                        </div>
                    )}
                    <div className="flex items-center gap-3 flex-wrap">
                        {center.hotline && (
                            <div className="flex items-center gap-1.5">
                                <Phone className="h-3 w-3 text-muted-foreground/50" />
                                <span>{center.hotline}</span>
                            </div>
                        )}
                        {center.email && (
                            <div className="flex items-center gap-1.5 min-w-0">
                                <Mail className="h-3 w-3 flex-shrink-0 text-muted-foreground/50" />
                                <span className="truncate">{center.email}</span>
                            </div>
                        )}
                    </div>
                    {todayHours && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="h-3 w-3 text-muted-foreground/50" />
                            <span>
                                Hôm nay:{' '}
                                <span className={isOpenToday ? 'text-emerald-600 dark:text-emerald-400 font-medium' : 'text-amber-500 dark:text-amber-400 font-medium'}>
                                    {todayHours}
                                </span>
                            </span>
                        </div>
                    )}
                </div>

                {/* Stats Pills Row */}
                {(center.rooms_count !== undefined || center.teachers_count !== undefined || center.students_count !== undefined) && (
                    <div className="mt-3.5 pt-3.5 border-t border-border flex items-center gap-2">
                        <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 px-2.5 py-1 rounded-md text-xs font-medium">
                            <Building2 className="h-3 w-3" />
                            {center.rooms_count || 0}
                        </div>
                        <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2.5 py-1 rounded-md text-xs font-medium">
                            <Users className="h-3 w-3" />
                            {center.teachers_count || 0}
                        </div>
                        <div className="flex items-center gap-1.5 bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 px-2.5 py-1 rounded-md text-xs font-medium">
                            <GraduationCap className="h-3 w-3" />
                            {center.students_count || 0}
                        </div>
                    </div>
                )}

                {/* Manager info */}
                {center.manager && (
                    <div className="mt-3 pt-3 border-t border-border">
                        <div className="flex items-center gap-2.5">
                            <div className="w-7 h-7 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0">
                                {center.manager.avatar_url ? (
                                    <img
                                        src={center.manager.avatar_url}
                                        alt={center.manager.full_name}
                                        className="w-7 h-7 rounded-full object-cover"
                                    />
                                ) : (
                                    <span className="text-[10px] font-semibold text-muted-foreground">
                                        {getInitials(center.manager.full_name)}
                                    </span>
                                )}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-medium text-foreground line-clamp-1 leading-tight">
                                    {center.manager.full_name}
                                </p>
                                <p className="text-[11px] text-muted-foreground/60">Quản lý</p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CenterCard;
