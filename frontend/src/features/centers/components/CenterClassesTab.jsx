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
    PauseCircle,
    XCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const STATUS_CONFIG = {
    upcoming: { label: 'Sắp khai giảng', color: 'bg-blue-100 text-blue-700', icon: Clock },
    ongoing: { label: 'Đang học', color: 'bg-emerald-100 text-emerald-700', icon: PlayCircle },
    completed: { label: 'Hoàn thành', color: 'bg-gray-100 text-gray-600', icon: CheckCircle },
    cancelled: { label: 'Đã hủy', color: 'bg-red-100 text-red-700', icon: XCircle }
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

    if (loading) {
        return (
            <div className="space-y-4">
                <div className="flex gap-4">
                    <div className="h-10 w-64 bg-gray-200 rounded animate-pulse" />
                    <div className="h-10 w-32 bg-gray-200 rounded animate-pulse" />
                </div>
                <div className="space-y-3">
                    {[1, 2, 3, 4].map(i => (
                        <Card key={i} className="p-4 animate-pulse">
                            <div className="h-6 w-48 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-32 bg-gray-200 rounded" />
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
                            placeholder="Tìm theo tên, mã, khóa học..."
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
                        <option value="upcoming">Sắp khai giảng</option>
                        <option value="ongoing">Đang học</option>
                        <option value="completed">Hoàn thành</option>
                        <option value="cancelled">Đã hủy</option>
                    </select>
                </div>

                <Button
                    onClick={() => navigate(`/admin/classes?centerId=${centerId}`)}
                    className="gap-2"
                    variant="outline"
                >
                    <ExternalLink className="h-4 w-4" />
                    Quản lý lớp học
                </Button>
            </div>

            {/* Stats summary */}
            <div className="flex flex-wrap gap-4 text-sm">
                <span className="text-gray-500">
                    Hiển thị <strong className="text-gray-700">{filteredClasses.length}</strong> / {classes.length} lớp
                </span>
                <span className="text-gray-300">|</span>
                <span className="text-blue-600">{stats.upcoming} sắp mở</span>
                <span className="text-emerald-600">{stats.ongoing} đang học</span>
                <span className="text-gray-600">{stats.completed} hoàn thành</span>
            </div>

            {/* Classes list */}
            {filteredClasses.length === 0 ? (
                <Card className="p-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                    <p className="text-gray-500">
                        {searchTerm || filterStatus
                            ? 'Không tìm thấy lớp học phù hợp'
                            : 'Chưa có lớp học nào'
                        }
                    </p>
                </Card>
            ) : (
                <div className="space-y-3">
                    {filteredClasses.map(cls => (
                        <ClassCard key={cls.id} cls={cls} onClick={() => navigate(`/admin/classes/${cls.id}`)} />
                    ))}
                </div>
            )}
        </div>
    );
}

// Class Card component
function ClassCard({ cls, onClick }) {
    const statusConfig = STATUS_CONFIG[cls.status] || STATUS_CONFIG.ongoing;
    const StatusIcon = statusConfig.icon;
    const teacher = cls.users || cls.teacher;

    // Format schedule display
    const formatSchedule = (schedule) => {
        if (!schedule) return '-';

        // If schedule is a string, return it directly
        if (typeof schedule === 'string') return schedule;

        // If schedule is not an array, try to convert or return '-'
        if (!Array.isArray(schedule)) {
            // If it's an object with day/time properties, format it
            if (schedule.day || schedule.start_time) {
                const days = { monday: 'T2', tuesday: 'T3', wednesday: 'T4', thursday: 'T5', friday: 'T6', saturday: 'T7', sunday: 'CN' };
                return `${days[schedule.day] || schedule.day || ''} ${schedule.start_time || ''}-${schedule.end_time || ''}`;
            }
            return '-';
        }

        if (!schedule.length) return '-';

        const days = {
            monday: 'T2',
            tuesday: 'T3',
            wednesday: 'T4',
            thursday: 'T5',
            friday: 'T6',
            saturday: 'T7',
            sunday: 'CN'
        };
        return schedule.map(s => `${days[s.day] || s.day} ${s.start_time}-${s.end_time}`).join(', ');
    };

    return (
        <Card
            className="p-4 hover:shadow-md transition-shadow cursor-pointer"
            onClick={onClick}
        >
            <div className="flex items-start justify-between">
                <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-gray-900 hover:text-indigo-600 transition-colors">
                            {cls.name}
                        </h4>
                        <Badge className={statusConfig.color}>
                            <StatusIcon className="h-3 w-3 mr-1" />
                            {statusConfig.label}
                        </Badge>
                    </div>

                    <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                        <span className="flex items-center gap-1">
                            <code className="bg-gray-100 px-1.5 py-0.5 rounded text-xs">{cls.code}</code>
                        </span>

                        {cls.courses?.title && (
                            <span className="flex items-center gap-1">
                                <BookOpen className="h-4 w-4 text-gray-400" />
                                {cls.courses.title}
                            </span>
                        )}

                        {teacher && (
                            <span className="flex items-center gap-1">
                                <User className="h-4 w-4 text-gray-400" />
                                {teacher.full_name}
                            </span>
                        )}

                        {cls.max_students && (
                            <span className="flex items-center gap-1">
                                <Users className="h-4 w-4 text-gray-400" />
                                {cls._count?.enrollments || 0}/{cls.max_students}
                            </span>
                        )}

                        {cls.schedule && (
                            <span className="flex items-center gap-1">
                                <Calendar className="h-4 w-4 text-gray-400" />
                                {formatSchedule(cls.schedule)}
                            </span>
                        )}
                    </div>

                    {/* Date range */}
                    <div className="mt-2 text-xs text-gray-400">
                        {cls.start_date && (
                            <span>
                                {new Date(cls.start_date).toLocaleDateString('vi-VN')}
                                {cls.end_date && ` - ${new Date(cls.end_date).toLocaleDateString('vi-VN')}`}
                            </span>
                        )}
                    </div>
                </div>

                <ExternalLink className="h-4 w-4 text-gray-300 hover:text-gray-500 flex-shrink-0" />
            </div>
        </Card>
    );
}

export default CenterClassesTab;
