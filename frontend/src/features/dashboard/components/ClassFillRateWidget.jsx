import { BookOpen, Users } from 'lucide-react';

export function ClassFillRateWidget({ classes = [], loading = false }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl">
                            <div className="flex justify-between">
                                <div className="h-4 w-32 bg-muted rounded" />
                                <div className="h-4 w-16 bg-muted rounded" />
                            </div>
                            <div className="h-3 w-24 bg-muted rounded" />
                            <div className="h-2 w-full bg-muted rounded-full mt-2" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (classes.length === 0) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                        <BookOpen size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Sĩ số lớp học</h3>
                        <p className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[200px]">
                    <BookOpen size={40} className="mb-3 opacity-50" />
                    <p className="text-sm font-medium">Không có dữ liệu lớp học</p>
                </div>
            </div>
        );
    }

    const getProgressColor = (percent) => {
        if (percent >= 100) return 'bg-emerald-500';
        if (percent >= 70) return 'bg-blue-500';
        return 'bg-amber-500';
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-blue-500/10 via-indigo-500/5 to-transparent p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <BookOpen size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Sĩ số lớp học</h3>
                            <p className="text-sm text-muted-foreground">Tỷ lệ lấp đầy</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {classes.map((cls, index) => {
                    const enrolled = cls.enrolled || 0;
                    const max = cls.maxCapacity || 0;
                    const percent = max > 0 ? Math.round((enrolled / max) * 100) : 0;
                    
                    return (
                        <div key={cls.id || index} className="p-3 rounded-xl hover:bg-muted transition-colors group">
                            <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground truncate max-w-[150px]">{cls.name}</span>
                                    {percent >= 100 && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">
                                            FULL
                                        </span>
                                    )}
                                </div>
                                <div className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                                    <Users size={14} className="text-muted-foreground" />
                                    {enrolled}/{max}
                                </div>
                            </div>
                            
                            <p className="text-xs text-muted-foreground truncate mb-3">{cls.courseName || 'Khóa học'}</p>
                            
                            {/* Progress bar */}
                            <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                                <div 
                                    className={`h-full rounded-full transition-all duration-700 ease-out group-hover:opacity-80 ${getProgressColor(percent)}`}
                                    style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                                />
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}

export default ClassFillRateWidget;
