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
    Wind,
    MoreHorizontal,
    Eye
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { DataTable } from '@/components/ui/data-table';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

const ROOM_TYPE_CONFIG = {
    standard: { label: 'Tiêu chuẩn', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200' },
    lab: { label: 'Phòng Lab', color: 'bg-purple-50 text-purple-700 hover:bg-purple-100 border-purple-200' },
    vip: { label: 'VIP', color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200' }
};

const STATUS_CONFIG = {
    active: { label: 'Hoạt động', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200', icon: CheckCircle },
    maintenance: { label: 'Bảo trì', color: 'bg-orange-50 text-orange-700 hover:bg-orange-100 border-orange-200', icon: Wrench },
    inactive: { label: 'Không dùng', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200', icon: Building2 }
};

const EQUIPMENT_ICONS = {
    projector: { icon: Projector, label: 'Máy chiếu' },
    whiteboard: { icon: Building2, label: 'Bảng trắng' },
    air_conditioner: { icon: Wind, label: 'Điều hòa' },
    computer: { icon: Monitor, label: 'Máy tính' },
    wifi: { icon: Wifi, label: 'Wifi' }
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

    const columns = [
        {
            key: 'code',
            label: 'Mã phòng',
            render: (_, row) => (
                <div className="font-mono text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                    {row.code}
                </div>
            )
        },
        {
            key: 'name',
            label: 'Tên phòng',
            sortable: true,
            render: (_, row) => (
                <div className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                    {row.name}
                </div>
            )
        },
        {
            key: 'capacity',
            label: 'Sức chứa',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-1.5 text-gray-700">
                    <Users className="h-4 w-4 text-gray-400" />
                    <span>{row.capacity || 0} chỗ</span>
                </div>
            )
        },
        {
            key: 'room_type',
            label: 'Loại phòng',
            render: (_, row) => {
                const config = ROOM_TYPE_CONFIG[row.room_type] || ROOM_TYPE_CONFIG.standard;
                return (
                    <Badge variant="outline" className={`font-normal ${config.color}`}>
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            key: 'equipment',
            label: 'Trang thiết bị',
            render: (_, row) => {
                const equipment = row.equipment || [];
                if (!equipment.length) return <span className="text-gray-400 text-sm italic">Không có</span>;

                return (
                    <div className="flex flex-wrap gap-1.5">
                        {equipment.slice(0, 3).map((eq, i) => {
                            const config = EQUIPMENT_ICONS[eq];
                            const Icon = config?.icon || Building2;
                            return (
                                <div 
                                    key={i} 
                                    className="p-1.5 bg-gray-50 border border-gray-100 rounded text-gray-500 hover:bg-gray-100 hover:text-gray-700 transition-colors cursor-help"
                                    title={config?.label || eq}
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </div>
                            );
                        })}
                        {equipment.length > 3 && (
                            <div className="px-1.5 py-1 bg-gray-50 border border-gray-100 rounded text-xs font-medium text-gray-500 flex items-center">
                                +{equipment.length - 3}
                            </div>
                        )}
                    </div>
                );
            }
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_, row) => {
                const status = row.status;
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.active;
                const Icon = config.icon;
                
                return (
                    <Badge variant="outline" className={`font-normal ${config.color}`}>
                        <Icon className="h-3 w-3 mr-1.5" />
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            key: 'actions',
            label: '',
            render: () => null
        }
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-64 bg-gray-100 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-100 rounded animate-pulse" />
                </div>
                <Card className="border-gray-200 shadow-sm overflow-hidden">
                    <div className="h-[400px] bg-gray-50/50 animate-pulse" />
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Header Controls */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm phòng học..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-white border-gray-200 focus-visible:ring-indigo-500 rounded-xl"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Hoạt động</option>
                        <option value="maintenance">Bảo trì</option>
                        <option value="inactive">Không dùng</option>
                    </select>

                    <select
                        value={filterType}
                        onChange={(e) => setFilterType(e.target.value)}
                        className="h-10 px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 text-gray-700"
                    >
                        <option value="">Tất cả loại phòng</option>
                        <option value="standard">Tiêu chuẩn</option>
                        <option value="lab">Phòng Lab</option>
                        <option value="vip">VIP</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate('/admin/rooms')}
                    variant="outline"
                    className="gap-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 rounded-xl w-full sm:w-auto"
                >
                    <ExternalLink className="h-4 w-4" />
                    Quản lý toàn bộ
                </Button>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                <Badge variant="secondary" className="bg-gray-100 text-gray-700 hover:bg-gray-100 border-0 whitespace-nowrap">
                    Tổng: {stats.total}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 border-0 whitespace-nowrap">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Hoạt động: {stats.active}
                </Badge>
                {stats.maintenance > 0 && (
                    <Badge variant="secondary" className="bg-orange-50 text-orange-700 hover:bg-orange-50 border-0 whitespace-nowrap">
                        <Wrench className="h-3 w-3 mr-1" />
                        Bảo trì: {stats.maintenance}
                    </Badge>
                )}
                <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 border-0 whitespace-nowrap">
                    <Users className="h-3 w-3 mr-1" />
                    Sức chứa: {stats.totalCapacity} chỗ
                </Badge>
            </div>

            {/* Data Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
                <DataTable 
                    columns={columns} 
                    data={filteredRooms} 
                    searchKey="name"
                    hideToolbar={true} // Hide our custom toolbar since we built one above
                    onRowClick={(row) => navigate(`/admin/rooms/${row.id}`)}
                />
            </Card>
        </div>
    );
}

export default CenterRoomsTab;
