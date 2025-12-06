/**
 * CenterRoomsTab Component - Tab danh sách phòng học
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Plus,
    Building2,
    Users,
    Wrench,
    CheckCircle,
    ExternalLink,
    Monitor,
    Projector,
    Wifi,
    Wind
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const ROOM_TYPE_CONFIG = {
    standard: { label: 'Tiêu chuẩn', color: 'bg-blue-100 text-blue-700' },
    lab: { label: 'Phòng Lab', color: 'bg-purple-100 text-purple-700' },
    vip: { label: 'VIP', color: 'bg-amber-100 text-amber-700' }
};

const STATUS_CONFIG = {
    active: { label: 'Hoạt động', color: 'bg-emerald-100 text-emerald-700', icon: CheckCircle },
    maintenance: { label: 'Bảo trì', color: 'bg-orange-100 text-orange-700', icon: Wrench },
    inactive: { label: 'Không dùng', color: 'bg-gray-100 text-gray-600', icon: Building2 }
};

const EQUIPMENT_ICONS = {
    projector: Projector,
    whiteboard: Building2,
    air_conditioner: Wind,
    computer: Monitor,
    wifi: Wifi
};

export function CenterRoomsTab({ rooms, loading = false, centerId }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');
    const [filterType, setFilterType] = useState('');

    // Filter rooms
    const filteredRooms = useMemo(() => {
        return rooms.filter(room => {
            const matchSearch = !searchTerm ||
                room.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                room.code?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = !filterStatus || room.status === filterStatus;
            const matchType = !filterType || room.room_type === filterType;
            return matchSearch && matchStatus && matchType;
        });
    }, [rooms, searchTerm, filterStatus, filterType]);

    // Stats
    const stats = useMemo(() => ({
        total: rooms.length,
        active: rooms.filter(r => r.status === 'active').length,
        maintenance: rooms.filter(r => r.status === 'maintenance').length,
        totalCapacity: rooms.reduce((sum, r) => sum + (r.capacity || 0), 0)
    }), [rooms]);

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {[1, 2, 3, 4, 5, 6].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="h-6 w-32 bg-gray-200 rounded mb-3" />
                            <div className="h-4 w-24 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-full bg-gray-200 rounded" />
                        </Card>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header */}
            <div className="flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex flex-wrap gap-3">
                    {/* Search */}
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm theo tên, mã..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Status filter */}
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="inactive">Không dùng</option>
                    </select>

                    {/* Type filter */}
                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                        <option value="">Tất cả loại phòng</option>
                        <option value="standard">Tiêu chuẩn</option>
                        <option value="lab">Phòng Lab</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate('/admin/rooms')}
                    className="gap-2"
                    variant="outline"
                >
                    <ExternalLink className="h-4 w-4" />
                    Quản lý phòng học
                </Button>
            </div>

            {/* Stats summary */}
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500">
                    Hiển thị <strong className="text-gray-700">{filteredRooms.length}</strong> / {rooms.length} phòng
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-emerald-600">{stats.active} hoạt động</span>
                <span className="text-orange-600">{stats.maintenance} bảo trì</span>
                <span className="text-gray-600">Sức chứa: {stats.totalCapacity} chỗ</span>
            </div>

            {/* Rooms grid */}
            {filteredRooms.length === 0 ? (
                <Card className="p-12 text-center">
                    <Building2 className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {searchTerm || filterStatus || filterType
                            ? 'Không tìm thấy phòng học phù hợp'
                            : 'Chưa có phòng học nào'
                        }
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredRooms.map(room => (
                        <RoomCard key={room.id} room={room} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Room Card component
function RoomCard({ room }) {
    const statusConfig = STATUS_CONFIG[room.status] || STATUS_CONFIG.active;
    const typeConfig = ROOM_TYPE_CONFIG[room.room_type] || ROOM_TYPE_CONFIG.standard;
    const StatusIcon = statusConfig.icon;

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-3">
                <div>
                    <h4 className="font-semibold text-gray-900">{room.name}</h4>
                    <p className="text-sm text-gray-500">Mã: {room.code}</p>
                </div>
                <Badge className={statusConfig.color}>
                    <StatusIcon className="h-3 w-3 mr-1" />
                    {statusConfig.label}
                </Badge>
            </div>

            <div className="flex items-center gap-4 mb-3 text-sm">
                <div className="flex items-center gap-1 text-gray-600">
                    <Users className="h-4 w-4 text-gray-400" />
                    {room.capacity || 0} chỗ
                </div>
                <Badge className={typeConfig.color}>
                    {typeConfig.label}
                </Badge>
            </div>

            {/* Equipment */}
            {room.equipment && room.equipment.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {room.equipment.slice(0, 4).map((eq, i) => {
                        const Icon = EQUIPMENT_ICONS[eq] || Building2;
                        return (
                            <span
                                key={i}
                                className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs text-gray-600"
                                title={eq}
                            >
                                <Icon className="h-3 w-3" />
                            </span>
                        );
                    })}
                    {room.equipment.length > 4 && (
                        <span className="px-2 py-1 bg-gray-100 rounded text-xs text-gray-600">
                            +{room.equipment.length - 4}
                        </span>
                    )}
                </div>
            )}

            {room.notes && (
                <p className="text-xs text-gray-500 mt-2 line-clamp-2">{room.notes}</p>
            )}
        </Card>
    );
}

export default CenterRoomsTab;
