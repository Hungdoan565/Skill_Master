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
    Phone
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '../utils';

const ROLE_CONFIG = {
    SUPER_ADMIN: { label: 'Super Admin', color: 'bg-red-100 text-red-700', icon: Shield },
    CENTER_MANAGER: { label: 'Quản lý', color: 'bg-purple-100 text-purple-700', icon: UserCheck },
    TEACHER: { label: 'Giáo viên', color: 'bg-blue-100 text-blue-700', icon: GraduationCap }
};

const STATUS_CONFIG = {
    active: { label: 'Hoạt động', color: 'bg-emerald-100 text-emerald-700' },
    inactive: { label: 'Ngừng', color: 'bg-gray-100 text-gray-600' }
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
                            <div className="flex gap-3">
                                <div className="h-12 w-12 bg-gray-200 rounded-full" />
                                <div className="flex-1">
                                    <div className="h-5 w-32 bg-gray-200 rounded mb-2" />
                                    <div className="h-4 w-24 bg-gray-200 rounded" />
                                </div>
                            </div>
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
                            placeholder="Tìm theo tên, email..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10"
                        />
                    </div>

                    {/* Role filter */}
                    <select
                        value={filterRole}
                        onChange={(e) => setFilterRole(e.target.value)}
                        className="px-3 py-2 border border-gray-200 rounded-lg text-sm"
                    >
                        <option value="">Tất cả vai trò</option>
                        <option value="TEACHER">Giáo viên</option>
                        <option value="CENTER_MANAGER">Quản lý</option>
                        <option value="SUPER_ADMIN">Super Admin</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate(`/admin/staff?centerId=${centerId}`)}
                    className="gap-2"
                    variant="outline"
                >
                    <ExternalLink className="h-4 w-4" />
                    Quản lý nhân sự
                </Button>
            </div>

            {/* Stats summary */}
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500">
                    Hiển thị <strong className="text-gray-700">{filteredStaff.length}</strong> / {staff.length} nhân sự
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-600">{stats.teachers} giáo viên</span>
                <span className="text-purple-600">{stats.managers} quản lý</span>
                <span className="text-emerald-600">{stats.active} hoạt động</span>
            </div>

            {/* Staff grid */}
            {filteredStaff.length === 0 ? (
                <Card className="p-12 text-center">
                    <Users className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {searchTerm || filterRole
                            ? 'Không tìm thấy nhân sự phù hợp'
                            : 'Chưa có nhân sự nào'
                        }
                    </p>
                </Card>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredStaff.map(member => (
                        <StaffCard key={member.id} staff={member} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Staff Card component
function StaffCard({ staff }) {
    const roleCode = staff.role_code || staff.roles?.code;
    const roleConfig = ROLE_CONFIG[roleCode] || ROLE_CONFIG.TEACHER;
    const statusConfig = STATUS_CONFIG[staff.status] || STATUS_CONFIG.active;
    const RoleIcon = roleConfig.icon;

    return (
        <Card className="p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start gap-3">
                {/* Avatar */}
                <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden flex-shrink-0">
                    {staff.avatar_url ? (
                        <img
                            src={staff.avatar_url}
                            alt={staff.full_name}
                            className="w-full h-full object-cover"
                        />
                    ) : (
                        <span className="text-lg font-medium text-gray-600">
                            {getInitials(staff.full_name)}
                        </span>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                        <h4 className="font-semibold text-gray-900 truncate">{staff.full_name}</h4>
                        <Badge className={statusConfig.color}>
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <Badge className={`${roleConfig.color} mb-2`}>
                        <RoleIcon className="h-3 w-3 mr-1" />
                        {roleConfig.label}
                    </Badge>

                    <div className="space-y-1 text-sm text-gray-600">
                        {staff.email && (
                            <a
                                href={`mailto:${staff.email}`}
                                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                            >
                                <Mail className="h-3 w-3 text-gray-400" />
                                <span className="truncate">{staff.email}</span>
                            </a>
                        )}
                        {staff.phone && (
                            <a
                                href={`tel:${staff.phone}`}
                                className="flex items-center gap-1 hover:text-indigo-600 transition-colors"
                            >
                                <Phone className="h-3 w-3 text-gray-400" />
                                <span>{staff.phone}</span>
                            </a>
                        )}
                    </div>
                </div>
            </div>
        </Card>
    );
}

export default CenterStaffTab;
