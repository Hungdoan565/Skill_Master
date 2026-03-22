import { Building2, Home } from 'lucide-react';

export function RoomUtilizationWidget({ rooms = [], summary = {}, loading = false }) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex flex-col gap-2 p-3 bg-muted/30 rounded-xl">
                            <div className="flex justify-between">
                                <div className="h-4 w-24 bg-muted rounded" />
                                <div className="h-4 w-12 bg-muted rounded" />
                            </div>
                            <div className="h-2 w-full bg-muted rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (rooms.length === 0) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full">
                <div className="flex items-center gap-3 mb-4">
                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                        <Building2 size={22} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-lg font-bold text-foreground">Sử dụng phòng học</h3>
                        <p className="text-sm text-muted-foreground">Công suất hiện tại</p>
                    </div>
                </div>
                <div className="flex flex-col items-center justify-center py-8 text-muted-foreground h-[200px]">
                    <Building2 size={40} className="mb-3 opacity-50" />
                    <p className="text-sm font-medium">Không có dữ liệu phòng học</p>
                </div>
            </div>
        );
    }

    const getProgressColor = (percent) => {
        if (percent > 80) return 'bg-emerald-500';
        if (percent >= 40) return 'bg-amber-500';
        return 'bg-zinc-500';
    };

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden h-full">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-violet-500/10 via-purple-500/5 to-transparent p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-violet-500 to-purple-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                            <Building2 size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Sử dụng phòng học</h3>
                            <p className="text-sm text-muted-foreground">Công suất hiện tại</p>
                        </div>
                    </div>
                </div>
                
                {/* Summary */}
                {summary.used !== undefined && summary.total !== undefined && (
                    <div className="mt-4 flex items-center gap-2 p-3 rounded-xl bg-muted/30">
                        <div className="w-8 h-8 rounded-lg bg-violet-500/10 flex items-center justify-center text-violet-600">
                            <Home size={16} />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wider">Hoạt động</p>
                            <p className="text-sm font-bold text-foreground">{summary.used}/{summary.total} phòng đang sử dụng</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {rooms.map((room, index) => {
                    const percent = room.utilization || 0;
                    return (
                        <div key={room.id || index} className="p-3 rounded-xl hover:bg-muted/50 transition-colors group">
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-foreground">{room.name}</span>
                                    {percent > 80 && (
                                        <span className="px-1.5 py-0.5 text-[10px] font-bold bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400 rounded">
                                            CAO
                                        </span>
                                    )}
                                </div>
                                <span className="text-sm font-bold text-foreground">{percent}%</span>
                            </div>
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

export default RoomUtilizationWidget;
