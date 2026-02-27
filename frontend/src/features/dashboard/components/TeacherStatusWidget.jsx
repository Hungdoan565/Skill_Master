import { Users, Clock } from 'lucide-react';

export function TeacherStatusWidget({ teachers = [], loading = false }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-6" />
                <div className="space-y-3">
                    {[...Array(4)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                            <div className="w-11 h-11 bg-muted rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-muted rounded mb-2" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                            <div className="w-16 h-6 bg-muted rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (teachers.length === 0) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Users size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Trạng thái giáo viên</h3>
                        <p className="text-sm text-muted-foreground">Hôm nay</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[200px]">
                    <Users size={40} className="mb-3 opacity-50" />
                    <p className="text-sm font-medium">Không có dữ liệu giáo viên</p>
                </div>
            </div>
        );
    }

    const getStatusStyle = (status) => {
        switch (status) {
            case 'teaching':
                return { bg: 'bg-emerald-100 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500', label: 'Đang dạy' };
            case 'available':
                return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'Sẵn sàng' };
            case 'on_leave':
                return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Nghỉ phép' };
            default:
                return { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-400', dot: 'bg-zinc-500', label: 'Không xác định' };
        }
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-emerald-500/10 via-green-500/5 to-transparent p-6 pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow-lg shadow-emerald-500/20">
                        <Users size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Trạng thái giáo viên</h3>
                        <p className="text-sm text-muted-foreground">Hôm nay</p>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-2">
                {teachers.slice(0, 5).map((teacher, index) => {
                    const statusInfo = getStatusStyle(teacher.status);
                    const initials = teacher.name
                        ? teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                        : '??';

                    return (
                        <div key={teacher.id || index} className="flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors">
                            {/* Avatar */}
                            <div className="w-11 h-11 rounded-full bg-emerald-100 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 flex flex-shrink-0 items-center justify-center font-bold text-sm ring-2 ring-emerald-500/10">
                                {initials}
                            </div>
                            
                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-foreground truncate">{teacher.name}</p>
                                <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
                                    <Clock size={12} />
                                    <span className="truncate">{teacher.classInfo || 'Không có lớp tiếp theo'}</span>
                                </div>
                            </div>
                            
                            {/* Status Badge */}
                            <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold flex-shrink-0 ${statusInfo.bg} ${statusInfo.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${statusInfo.dot}`} />
                                {statusInfo.label}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default TeacherStatusWidget;
