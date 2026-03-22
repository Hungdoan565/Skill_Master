/**
 * CenterStudentsTab Component - Tab danh sách học viên
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    GraduationCap,
    UserCheck,
    UserX,
    ExternalLink,
    Mail,
    Phone,
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
import { getInitials } from '../utils';

const STATUS_CONFIG = {
    active: { label: 'Đang học', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200' },
    inactive: { label: 'Ngừng', color: 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600' },
    suspended: { label: 'Tạm khóa', color: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200' }
};

export function CenterStudentsTab({ students, loading = false, centerId }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Filter students
    const filteredStudents = useMemo(() => {
        return students.filter(s => {
            const matchSearch = !searchTerm ||
                s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = !filterStatus || s.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [students, searchTerm, filterStatus]);

    // Stats
    const stats = useMemo(() => {
        return {
            total: students.length,
            active: students.filter(s => s.status === 'active').length,
            inactive: students.filter(s => s.status !== 'active').length
        };
    }, [students]);

    const columns = [
        {
            key: 'full_name',
            label: 'Học viên',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-fuchsia-50 dark:bg-fuchsia-900/30 border border-fuchsia-100 dark:border-fuchsia-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {row.avatar_url ? (
                            <img
                                src={row.avatar_url}
                                alt={row.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-semibold text-fuchsia-700">
                                {getInitials(row.full_name)}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-fuchsia-600 transition-colors">
                            {row.full_name}
                        </span>
                        {row.email && (
                            <span className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <Mail className="h-3 w-3" />
                                {row.email}
                            </span>
                        )}
                    </div>
                </div>
            )
        },
        {
            key: 'phone',
            label: 'Số điện thoại',
            render: (_, row) => {
                const phone = row.phone;
                if (!phone) return <span className="text-muted-foreground text-sm italic">-</span>;
                
                return (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
                        <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                        <span>{phone}</span>
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
                
                return (
                    <Badge variant="outline" className={`font-normal ${config.color}`}>
                        {config.label}
                    </Badge>
                );
            }
        },
        {
            key: 'actions',
            label: '',
            render: (_, row) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/students/${row.id}`)}>
                                <Eye className="mr-2 h-4 w-4" />
                                <span>Xem chi tiết</span>
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            )
        }
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>
                <Card className="border-border shadow-sm overflow-hidden">
                    <div className="h-[400px] bg-muted/30 animate-pulse" />
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
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Tìm kiếm học viên..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-background border-border focus-visible:ring-fuchsia-500 rounded-xl"
                        />
                    </div>

                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="h-10 px-3 py-2 bg-background border border-border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-fuchsia-500 text-foreground"
                    >
                        <option value="">Tất cả trạng thái</option>
                        <option value="active">Đang học</option>
                        <option value="inactive">Ngừng</option>
                        <option value="suspended">Tạm khóa</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate(`/admin/students?centerId=${centerId}`)}
                    variant="outline"
                    className="gap-2 border-border bg-card hover:bg-muted text-foreground rounded-xl w-full sm:w-auto"
                >
                    <ExternalLink className="h-4 w-4" />
                    Quản lý toàn bộ
                </Button>
            </div>

            {/* Stats Pills */}
            <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-2 px-2 sm:mx-0 sm:px-0 scrollbar-hide">
                <Badge variant="secondary" className="bg-muted text-foreground hover:bg-muted border-0 whitespace-nowrap">
                    Tổng: {stats.total}
                </Badge>
                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 border-0 whitespace-nowrap">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Đang học: {stats.active}
                </Badge>
                <Badge variant="secondary" className="bg-muted text-muted-foreground hover:bg-muted border-0 whitespace-nowrap">
                    <UserX className="h-3 w-3 mr-1" />
                    Ngừng: {stats.inactive}
                </Badge>
            </div>

            {/* Data Table */}
            <Card className="border-border shadow-sm overflow-hidden bg-card">
                <DataTable 
                    columns={columns} 
                    data={filteredStudents} 
                    searchKey="full_name"
                    hideToolbar={true}
                    onRowClick={(row) => navigate(`/admin/students/${row.id}`)}
                />
            </Card>
        </div>
    );
}

export default CenterStudentsTab;
