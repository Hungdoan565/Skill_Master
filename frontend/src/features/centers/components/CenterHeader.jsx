/**
 * CenterHeader Component - Header cho Center Detail Page
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowLeft,
    Building2,
    MapPin,
    Phone,
    Mail,
    Edit,
    UserPlus,
    ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { STATUS_CONFIG, getInitials, getGradient } from '../utils';

export function CenterHeader({
    center,
    onEdit,
    onAssignManager,
    // canManage // Actions are now always visible based on PRD
}) {
    const navigate = useNavigate();

    if (!center) return null;

    const statusConfig = STATUS_CONFIG[center.status] || STATUS_CONFIG.active;
    const gradient = getGradient(center.name);

    return (
        <div className="bg-card rounded-xl shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05),_0_1px_4px_-1px_rgba(0,0,0,0.02)] border border-border overflow-hidden">
            {/* Very compact banner */}
            <div className={`h-12 ${gradient} relative flex items-center justify-between px-4`}>
                <button
                    onClick={() => navigate('/admin/centers')}
                    className="flex items-center gap-2 text-sm font-medium text-white/90 hover:text-white transition-colors"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>

                {/* Actions moved to banner for compactness */}
                <div className="flex items-center gap-2">
                    <Button
                        size="sm"
                        variant="secondary"
                        onClick={onAssignManager}
                        className="h-8 bg-white/10 hover:bg-white/20 text-white border-0 shadow-none"
                    >
                        <UserPlus className="h-3.5 w-3.5 mr-1.5" />
                        Gán quản lý
                    </Button>
                    <Button
                        size="sm"
                        onClick={onEdit}
                        className="h-8 bg-white text-gray-900 hover:bg-gray-50 border-0 shadow-sm"
                    >
                        <Edit className="h-3.5 w-3.5 mr-1.5" />
                        Chỉnh sửa
                    </Button>
                </div>
            </div>

            {/* Inline Info Area */}
            <div className="px-6 py-5">
                <div className="flex flex-col md:flex-row gap-5 items-start md:items-center">
                    {/* Logo - Inline */}
                    <div className="flex-shrink-0">
                        {center.logo_url ? (
                            <img
                                src={center.logo_url}
                                alt={center.name}
                                className="w-16 h-16 rounded-xl border border-border shadow-sm object-cover bg-card"
                            />
                        ) : (
                            <div className="w-16 h-16 rounded-xl border border-border shadow-sm bg-card flex items-center justify-center">
                                <span className="text-xl font-bold text-muted-foreground tracking-tight">
                                    {getInitials(center.name)}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Main Info */}
                    <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-3 mb-1.5">
                            <h1 className="text-2xl font-bold text-foreground tracking-tight truncate">
                                {center.name}
                            </h1>
                            <Badge className={`${statusConfig.color} border-0 capitalize shadow-none`}>
                                {statusConfig.label}
                            </Badge>
                            {center.code && (
                                <Badge variant="outline" className="text-muted-foreground border-border shadow-none font-medium">
                                    #{center.code}
                                </Badge>
                            )}
                        </div>

                        {center.description && (
                            <p className="text-sm text-muted-foreground truncate mt-1 max-w-2xl">{center.description}</p>
                        )}

                        {/* Contact info compact pills row */}
                        <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-muted-foreground mt-3 pt-3 border-t border-border">
                            {center.address && (
                                <div className="flex items-center gap-1.5">
                                    <MapPin className="h-3.5 w-3.5 text-muted-foreground" />
                                    <span className="truncate max-w-[200px] lg:max-w-xs">{center.address}</span>
                                </div>
                            )}
                            {center.hotline && (
                                <a href={`tel:${center.hotline}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                    <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                                    {center.hotline}
                                </a>
                            )}
                            {center.email && (
                                <a href={`mailto:${center.email}`} className="flex items-center gap-1.5 hover:text-indigo-600 transition-colors">
                                    <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                                    {center.email}
                                </a>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default CenterHeader;
