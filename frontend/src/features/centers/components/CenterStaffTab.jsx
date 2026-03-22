/**
 * CenterStaffTab Component - Tab danh sách nhân sự
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    Users,
    UserCheck,
    Shield,
    GraduationCap,
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
import { SimpleSelect } from '@/features/staff/components/SimpleSelect';

const ROLE_CONFIG = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 border-red-200 dark:border-red-800', icon: Shield },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-purple-200 dark:border-purple-800', icon: UserCheck },
    TEACHER: { label: 'Giáo viên', color: 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-blue-200 dark:border-blue-800', icon: GraduationCap }
};

const STATUS_CONFIG = {
    active: { label: 'Hoạt động', color: 'bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-emerald-200 dark:border-emerald-800' },
    inactive: { label: 'Ngừng', color: 'bg-gray-50 dark:bg-gray-800/50 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border-gray-200 dark:border-gray-600' }
};

export function CenterStaffTab({ staff, loading = false, centerId }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterRole, setFilterRole] = useState('');

    // Filter staff
    const filteredStaff = useMemo(() => {
        return staff.filter(s => {
            const matchSearch = !searchTerm ||
                s.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                s.email?.toLowerCase().includes(searchTerm.toLowerCase());
            const roleCode = s.role_code || s.roles?.code;
            const matchRole = !filterRole || roleCode === filterRole;
            return matchSearch && matchRole;
        });
    }, [staff, searchTerm, filterRole]);

    // Stats
    const stats = useMemo(() => {
        const teachers = staff.filter(s => (s.role_code || s.roles?.code) === 'TEACHER');
        const managers = staff.filter(s => (s.role_code || s.roles?.code) === 'CENTER_MANAGER');
        return {
            total: staff.length,
            teachers: teachers.length,
            managers: managers.length,
            active: staff.filter(s => s.status === 'active').length
        };
    }, [staff]);

    const columns = [
        {
            key: 'full_name',
            label: 'Nhân viên',
            sortable: true,
            render: (_, row) => (
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-900/30 border border-indigo-100 dark:border-indigo-800 flex items-center justify-center overflow-hidden flex-shrink-0">
                        {row.avatar_url ? (
                            <img
                                src={row.avatar_url}
                                alt={row.full_name}
                                className="w-full h-full object-cover"
                            />
                        ) : (
                            <span className="text-xs font-semibold text-indigo-700 dark:text-indigo-300">
                                {getInitials(row.full_name)}
                            </span>
                        )}
                    </div>
                    <div className="flex flex-col">
                        <span className="font-medium text-foreground group-hover:text-indigo-600 transition-colors">
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
            key: 'role',
            label: 'Vai trò',
            render: (_, row) => {
                const roleCode = row.role_code || row.roles?.code;
                const config = ROLE_CONFIG[roleCode] || ROLE_CONFIG.TEACHER;
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
            render: () => null
        }
    ];

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex justify-between items-center">
                    <div className="h-10 w-64 bg-muted rounded animate-pulse" />
                    <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                </div>
                <Card className="border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden">
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
                            placeholder="Tìm kiếm nhân sự..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-gray-50 dark:bg-zinc-950 border-gray-200 dark:border-zinc-800 focus-visible:ring-indigo-500 rounded-xl"
                        />
                    </div>

                    <div className="w-[180px]">
                        <SimpleSelect
                            value={filterRole}
                            onChange={setFilterRole}
                            placeholder="Tất cả vai trò"
                            options={[
                                { value: 'TEACHER', label: 'Giáo viên' },
                                { value: 'CENTER_MANAGER', label: 'Quản lý' },
                                { value: 'SUPER_ADMIN', label: 'Super Admin' }
                            ]}
                        />
                    </div>
                </div>
                <Button
                    onClick={() => navigate(`/admin/staff?centerId=${centerId}`)}
                    variant="outline"
                    className="gap-2 border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 hover:bg-muted text-foreground rounded-xl w-full sm:w-auto"
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
                <Badge variant="secondary" className="bg-emerald-50 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 border-0 whitespace-nowrap">
                    Hoạt động: {stats.active}
                </Badge>
                <Badge variant="secondary" className="bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 hover:bg-purple-100 dark:hover:bg-purple-900/40 border-0 whitespace-nowrap">
                    <UserCheck className="h-3 w-3 mr-1" />
                    Quản lý: {stats.managers}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-900/40 border-0 whitespace-nowrap">
                    <GraduationCap className="h-3 w-3 mr-1" />
                    Giáo viên: {stats.teachers}
                </Badge>
            </div>

            {/* Data Table */}
            <Card className="border-gray-200 dark:border-zinc-800 shadow-sm overflow-hidden bg-white dark:bg-zinc-900">
                <DataTable
                    columns={columns}
                    data={filteredStaff}
                    searchKey="full_name"
                    hideToolbar={true} // Hide our custom toolbar
                    onRowClick={(row) => navigate(`/admin/staff/${row.id}`)}
                />
            </Card>
        </div>
    );
}

export default CenterStaffTab;
