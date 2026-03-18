/**
 * CenterClassesTab Component - Tab danh sách lớp học
 */

import React, { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Search,
    BookOpen,
    Users,
    Calendar,
    User,
    ExternalLink,
    Clock,
    CheckCircle,
    PlayCircle,
    XCircle,
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

const STATUS_CONFIG = {
    upcoming: { label: 'Sắp khai giảng', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100 border-blue-200', icon: Clock },
    ongoing: { label: 'Đang học', color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200', icon: PlayCircle },
    completed: { label: 'Hoàn thành', color: 'bg-gray-50 text-gray-700 hover:bg-gray-100 border-gray-200', icon: CheckCircle },
    cancelled: { label: 'Đã hủy', color: 'bg-red-50 text-red-700 hover:bg-red-100 border-red-200', icon: XCircle }
};

// Helper for formatting schedule
const formatSchedule = (schedule) => {
    if (!schedule) return '-';
    if (typeof schedule === 'string') {
        try {
            schedule = JSON.parse(schedule);
        } catch {
            return schedule;
        }
    }

    // Map both numeric (1-7, 0-6) and string day keys
    const dayMap = {
        0: 'CN', 1: 'T2', 2: 'T2', 3: 'T3', 4: 'T4', 5: 'T5', 6: 'T6', 7: 'T7',
        monday: 'T2', tuesday: 'T3', wednesday: 'T4',
        thursday: 'T5', friday: 'T6', saturday: 'T7', sunday: 'CN'
    };

    const formatOne = (s) => {
        const dayKey = String(s.day).toLowerCase();
        const dayLabel = dayMap[dayKey] || dayMap[s.day] || `T${s.day}`;
        const start = s.start_time || s.start || '';
        const end = s.end_time || s.end || '';
        return `${dayLabel} ${start}-${end}`;
    };

    if (!Array.isArray(schedule)) {
        if (schedule.day !== undefined) return formatOne(schedule);
        return '-';
    }

    if (!schedule.length) return '-';
    return schedule.map(formatOne).join(', ');
};

export function CenterClassesTab({ classes, loading = false, centerId }) {
    const navigate = useNavigate();
    const [searchTerm, setSearchTerm] = useState('');
    const [filterStatus, setFilterStatus] = useState('');

    // Filter classes
    const filteredClasses = useMemo(() => {
        return classes.filter(cls => {
            const matchSearch = !searchTerm ||
                cls.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cls.code?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                cls.courses?.title?.toLowerCase().includes(searchTerm.toLowerCase());
            const matchStatus = !filterStatus || cls.status === filterStatus;
            return matchSearch && matchStatus;
        });
    }, [classes, searchTerm, filterStatus]);

    // Stats
    const stats = useMemo(() => ({
        total: classes.length,
        upcoming: classes.filter(c => c.status === 'upcoming').length,
        ongoing: classes.filter(c => c.status === 'ongoing').length,
        completed: classes.filter(c => c.status === 'completed').length
    }), [classes]);

    const columns = [
        {
            key: 'code',
            label: 'Mã lớp',
            render: (_, row) => (
                <div className="font-mono text-xs font-medium text-gray-500 bg-gray-50 px-2 py-1 rounded inline-block">
                    {row.code}
                </div>
            )
        },
        {
            key: 'name',
            label: 'Tên lớp',
            sortable: true,
            render: (_, row) => (
                <div>
                    <p className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                        {row.name}
                    </p>
                    {row.courses?.title && (
                        <p className="text-xs text-gray-500 mt-0.5 flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            <span className="truncate max-w-[200px]">{row.courses.title}</span>
                        </p>
                    )}
                </div>
            )
        },
        {
            key: 'teacher',
            label: 'Giáo viên',
            render: (_, row) => {
                const teacher = row.users || row.teacher;
                return teacher ? (
                    <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                            <span className="text-xs font-medium text-indigo-700">
                                {teacher.full_name?.charAt(0)}
                            </span>
                        </div>
                        <span className="text-sm text-gray-700">{teacher.full_name}</span>
                    </div>
                ) : (
                    <span className="text-gray-400 text-sm italic">Chưa phân công</span>
                );
            }
        },
        {
            key: 'students',
            label: 'Học viên',
            render: (_, row) => {
                const enrolled = row.enrolled_count || row.enrollment_breakdown?.active || row._count?.enrollments || 0;
                const max = row.max_students;
                const isFull = enrolled >= max;
                
                return (
                    <div className="flex items-center gap-1.5">
                        <Users className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm ${isFull ? 'text-amber-600 font-medium' : 'text-gray-700'}`}>
                            {enrolled} {max ? `/ ${max}` : ''}
                        </span>
                    </div>
                );
            }
        },
        {
            key: 'schedule',
            label: 'Lịch học',
            render: (_, row) => (
                <div className="text-sm text-gray-600 flex items-center gap-1.5">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <span className="truncate max-w-[150px]" title={formatSchedule(row.schedule)}>
                        {formatSchedule(row.schedule)}
                    </span>
                </div>
            )
        },
        {
            key: 'status',
            label: 'Trạng thái',
            render: (_, row) => {
                const status = row.status;
                const config = STATUS_CONFIG[status] || STATUS_CONFIG.ongoing;
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
            render: (_, row) => (
                <div className="flex justify-end">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Mở menu</span>
                                <MoreHorizontal className="h-4 w-4 text-gray-500" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => navigate(`/admin/classes/${row.id}`)}>
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
                <div className="flex items-center gap-3 w-full sm:w-auto">
                    <div className="relative w-full sm:w-72">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input
                            placeholder="Tìm kiếm lớp học..."
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
                        <option value="upcoming">Sắp khai giảng</option>
                        <option value="ongoing">Đang học</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate(`/admin/classes?centerId=${centerId}`)}
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
                    <PlayCircle className="h-3 w-3 mr-1" />
                    Đang học: {stats.ongoing}
                </Badge>
                <Badge variant="secondary" className="bg-blue-50 text-blue-700 hover:bg-blue-50 border-0 whitespace-nowrap">
                    <Clock className="h-3 w-3 mr-1" />
                    Sắp khai giảng: {stats.upcoming}
                </Badge>
            </div>

            {/* Data Table */}
            <Card className="border-gray-200 shadow-sm overflow-hidden bg-white">
                <DataTable 
                    columns={columns} 
                    data={filteredClasses} 
                    searchKey="name"
                    hideToolbar={true} // Hide default toolbar since we built our own
                    onRowClick={(row) => navigate(`/admin/classes/${row.id}`)}
                />
            </Card>
        </div>
    );
}

export default CenterClassesTab;
