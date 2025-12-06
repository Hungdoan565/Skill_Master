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
    canManage = false
}) {
    const navigate = useNavigate();

    if (!center) return null;

    const statusConfig = STATUS_CONFIG[center.status] || STATUS_CONFIG.active;
    const gradient = getGradient(center.name);

    return (
        <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
            {/* Gradient banner */}
            <div className={`h-24 ${gradient} relative`}>
                {/* Back button */}
                <button
                    onClick={() => navigate('/admin/centers')}
                    className="absolute top-4 left-4 p-2 bg-white/80 hover:bg-white rounded-lg transition-colors flex items-center gap-2 text-sm font-medium text-gray-700"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Quay lại
                </button>

                {/* Actions */}
                {canManage && (
                    <div className="absolute top-4 right-4 flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onAssignManager}
                            className="bg-white/90 hover:bg-white"
                        >
                            <UserPlus className="h-4 w-4 mr-1" />
                            Gán quản lý
                        </Button>
                        <Button
                            size="sm"
                            onClick={onEdit}
                            className="bg-white/90 hover:bg-white text-gray-700"
                        >
                            <Edit className="h-4 w-4 mr-1" />
                            Chỉnh sửa
                        </Button>
                    </div>
                )}

                {/* Logo */}
                <div className="absolute -bottom-10 left-6">
                    {center.logo_url ? (
                        <img
                            src={center.logo_url}
                            alt={center.name}
                            className="w-20 h-20 rounded-xl border-4 border-white shadow-lg object-cover bg-white"
                        />
                    ) : (
                        <div className="w-20 h-20 rounded-xl border-4 border-white shadow-lg bg-white flex items-center justify-center">
                            <span className="text-2xl font-bold text-gray-600">
                                {getInitials(center.name)}
                            </span>
                        </div>
                    )}
                </div>
            </div>

            {/* Info */}
            <div className="pt-14 pb-6 px-6">
                <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-2">
                            <h1 className="text-2xl font-bold text-gray-900">{center.name}</h1>
                            <Badge className={`${statusConfig.bg || statusConfig.color} ${statusConfig.text} border-0`}>
                                {statusConfig.label}
                            </Badge>
                        </div>
                        {center.code && (
                            <span className="text-sm text-gray-500 block mb-2">Mã: #{center.code}</span>
                        )}
                        {center.description && (
                            <p className="text-gray-600 max-w-2xl">{center.description}</p>
                        )}
                    </div>

                    {/* Contact info compact */}
                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        {center.address && (
                            <div className="flex items-center gap-2">
                                <MapPin className="h-4 w-4 text-gray-400" />
                                <span className="max-w-xs truncate">{center.address}</span>
                            </div>
                        )}
                        {center.hotline && (
                            <a href={`tel:${center.hotline}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                                <Phone className="h-4 w-4" />
                                {center.hotline}
                            </a>
                        )}
                        {center.email && (
                            <a href={`mailto:${center.email}`} className="flex items-center gap-2 text-indigo-600 hover:underline">
                                <Mail className="h-4 w-4" />
                                {center.email}
                            </a>
                        )}
                    </div>
                </div>

                {/* Manager info */}
                {center.manager && (
                    <div className="mt-4 pt-4 border-t flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
                            {center.manager.avatar_url ? (
                                <img
                                    src={center.manager.avatar_url}
                                    alt={center.manager.full_name}
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <span className="text-sm font-medium text-gray-600">
                                    {getInitials(center.manager.full_name)}
                                </span>
                            )}
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-900">
                                Quản lý: {center.manager.full_name}
                            </p>
                            {center.manager.email && (
                                <p className="text-xs text-gray-500">{center.manager.email}</p>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

export default CenterHeader;
