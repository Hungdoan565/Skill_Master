/**
 * TopTeachersWidget Component V2
 * Enhanced with progress bars, hover effects, and richer visuals
 */

import { Trophy, Star, Users, ChevronRight, TrendingUp, Award } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

// Medal styling with gradients
const MEDAL_STYLES = {
    1: {
        bg: 'bg-gradient-to-br from-amber-400 to-yellow-500',
        text: 'text-white',
        icon: '🥇',
        shadow: 'shadow-lg shadow-amber-500/30'
    },
    2: {
        bg: 'bg-gradient-to-br from-gray-300 to-gray-400',
        text: 'text-white',
        icon: '🥈',
        shadow: 'shadow-lg shadow-gray-400/30'
    },
    3: {
        bg: 'bg-gradient-to-br from-orange-400 to-amber-600',
        text: 'text-white',
        icon: '🥉',
        shadow: 'shadow-lg shadow-orange-500/30'
    },
};

// Calculate bar width based on students (max = first place)
const getBarWidth = (students, maxStudents) => {
    if (!maxStudents) return 0;
    return Math.round((students / maxStudents) * 100);
};

function TeacherRow({ rank, teacher, maxStudents, isLast }) {
    const medal = MEDAL_STYLES[rank];
    const initials = teacher.name
        ? teacher.name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
        : '??';
    const barWidth = getBarWidth(teacher.students, maxStudents);

    return (
        <div
            className={`
        relative group p-3 rounded-xl transition-all duration-300
        hover:bg-muted/50 hover:scale-[1.01] cursor-pointer
        ${!isLast ? 'mb-2' : ''}
      `}
        >
            <div className="flex items-center gap-3 relative z-10">
                {/* Rank Medal */}
                <div className={`
          w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold
          ${medal
                        ? `${medal.bg} ${medal.text} ${medal.shadow}`
                        : 'bg-muted text-muted-foreground'
                    }
        `}>
                    {medal ? <span className="text-lg">{medal.icon}</span> : rank}
                </div>

                {/* Avatar with ring for top 3 */}
                <div className={`
          relative w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0
          ${rank <= 3
                        ? 'bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/30'
                        : 'bg-primary/10'
                    }
        `}>
                    <span className="text-sm font-bold text-primary">{initials}</span>
                    {rank === 1 && (
                        <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-lg">
                            <Award size={12} className="text-white" />
                        </div>
                    )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground truncate">{teacher.name}</p>
                        {rank === 1 && (
                            <span className="px-1.5 py-0.5 text-[10px] font-bold bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400 rounded">
                                TOP
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{teacher.subject || 'Giáo viên'}</p>
                </div>

                {/* Stats */}
                <div className="text-right flex-shrink-0">
                    <div className="flex items-center justify-end gap-1.5 text-sm font-bold text-foreground">
                        <Users size={14} className="text-primary" />
                        {teacher.students || 0}
                    </div>
                    {teacher.rating && (
                        <div className="flex items-center justify-end gap-1 text-xs">
                            <Star size={11} className="text-amber-500" fill="currentColor" />
                            <span className="text-amber-600 font-semibold">{Number(teacher.rating).toFixed(1)}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Progress bar background */}
            <div className="absolute inset-0 rounded-xl overflow-hidden">
                <div
                    className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-primary/8 to-transparent transition-all duration-700 group-hover:from-primary/12"
                    style={{ width: `${barWidth}%` }}
                />
            </div>
        </div>
    );
}

// Summary stat card
function SummaryCard({ icon: Icon, label, value, color }) {
    return (
        <div className="flex items-center gap-2 p-2 rounded-lg bg-muted/30">
            <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon size={14} style={{ color }} />
            </div>
            <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}

export function TopTeachersWidget({ teachers = [], loading = false }) {
    const navigate = useNavigate();

    // Mock data if empty
    const displayTeachers = teachers.length > 0 ? teachers : [
        { id: 1, name: 'Nguyễn Văn A', subject: 'IELTS Speaking', students: 45, rating: 4.9 },
        { id: 2, name: 'Trần Thị B', subject: 'TOEIC Listening', students: 38, rating: 4.8 },
        { id: 3, name: 'Lê Văn C', subject: 'Korean TOPIK', students: 32, rating: 4.7 },
        { id: 4, name: 'Phạm Thị D', subject: 'IT Fundamentals', students: 28, rating: 4.6 },
        { id: 5, name: 'Hoàng Văn E', subject: 'IELTS Writing', students: 25, rating: 4.5 },
    ];

    const maxStudents = Math.max(...displayTeachers.map(t => t.students || 0));
    const totalStudents = displayTeachers.reduce((sum, t) => sum + (t.students || 0), 0);
    const avgRating = displayTeachers.reduce((sum, t) => sum + (Number(t.rating) || 0), 0) / displayTeachers.length;

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-6" />
                <div className="space-y-3">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-3 bg-muted/30 rounded-xl">
                            <div className="w-9 h-9 bg-muted rounded-xl" />
                            <div className="w-11 h-11 bg-muted rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-muted rounded mb-2" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-transparent p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-amber-500 to-yellow-500 flex items-center justify-center shadow-lg shadow-amber-500/20">
                            <Trophy size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Top Giáo viên</h3>
                            <p className="text-sm text-muted-foreground">Theo số học viên</p>
                        </div>
                    </div>
                    <button
                        onClick={() => navigate('/admin/staff')}
                        className="p-2 rounded-xl hover:bg-muted transition-colors text-muted-foreground hover:text-foreground"
                    >
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Summary stats */}
                <div className="flex gap-2 mt-4">
                    <SummaryCard
                        icon={Users}
                        label="Tổng HV"
                        value={totalStudents}
                        color="#3b82f6"
                    />
                    <SummaryCard
                        icon={Star}
                        label="Đánh giá TB"
                        value={avgRating.toFixed(1)}
                        color="#f59e0b"
                    />
                    <SummaryCard
                        icon={TrendingUp}
                        label="Giáo viên"
                        value={displayTeachers.length}
                        color="#10b981"
                    />
                </div>
            </div>

            {/* Leaderboard */}
            <div className="p-4">
                {displayTeachers.slice(0, 5).map((teacher, index) => (
                    <TeacherRow
                        key={teacher.id || index}
                        rank={index + 1}
                        teacher={teacher}
                        maxStudents={maxStudents}
                        isLast={index === Math.min(4, displayTeachers.length - 1)}
                    />
                ))}
            </div>
        </div>
    );
}

export default TopTeachersWidget;
