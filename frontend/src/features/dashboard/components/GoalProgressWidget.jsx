/**
 * GoalProgressWidget Component V2
 * Enhanced with better visual density and rich UI
 */

import { Target, TrendingUp, AlertCircle, Zap, Calendar } from 'lucide-react';

// Helper to calculate percentage
const calculateProgress = (current, target) => {
    if (!target || target === 0) return 0;
    return Math.min(100, Math.round((current / target) * 100));
};

// Format currency
const formatCurrency = (value) => {
    if (!value) return '0đ';
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    if (value >= 1000) return `${(value / 1000).toFixed(0)}K`;
    return `${value}đ`;
};

// Get days remaining in month
const getDaysRemaining = () => {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return lastDay.getDate() - now.getDate();
};

// Circular Progress Ring with gradient
function ProgressRing({ progress, size = 140, strokeWidth = 12 }) {
    const radius = (size - strokeWidth) / 2;
    const circumference = radius * 2 * Math.PI;
    const offset = circumference - (progress / 100) * circumference;

    const getColor = () => {
        if (progress >= 100) return { main: '#10b981', glow: 'rgba(16, 185, 129, 0.3)' };
        if (progress >= 70) return { main: '#f97316', glow: 'rgba(249, 115, 22, 0.3)' };
        return { main: '#ef4444', glow: 'rgba(239, 68, 68, 0.3)' };
    };

    const colors = getColor();

    return (
        <div className="relative" style={{ width: size, height: size }}>
            {/* Glow effect */}
            <div
                className="absolute inset-0 rounded-full blur-xl opacity-50"
                style={{ backgroundColor: colors.glow }}
            />

            <svg width={size} height={size} className="transform -rotate-90 relative z-10">
                {/* Background circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={strokeWidth}
                    className="text-muted/20"
                />
                {/* Progress circle */}
                <circle
                    cx={size / 2}
                    cy={size / 2}
                    r={radius}
                    fill="none"
                    stroke={colors.main}
                    strokeWidth={strokeWidth}
                    strokeLinecap="round"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    className="transition-all duration-1000 ease-out drop-shadow-lg"
                />
            </svg>

            {/* Center content */}
            <div className="absolute inset-0 flex flex-col items-center justify-center z-20">
                <span className="text-3xl font-black text-foreground">{progress}%</span>
                <span className="text-xs font-medium text-muted-foreground">hoàn thành</span>
            </div>
        </div>
    );
}

// Enhanced Progress Bar with animation
function GoalItem({ label, icon: Icon, current, target, color, accentBg }) {
    const progress = calculateProgress(current, target);
    const isAhead = progress >= 100;
    const isBehind = progress < 70;
    const displayColor = isAhead ? '#10b981' : isBehind ? '#ef4444' : color;

    return (
        <div className={`p-4 rounded-xl ${accentBg} border border-border/50`}>
            <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                    <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: `${color}20` }}
                    >
                        <Icon size={16} style={{ color }} />
                    </div>
                    <span className="font-semibold text-foreground">{label}</span>
                </div>
                <div className="text-right">
                    <p className="text-sm font-bold text-foreground">{formatCurrency(current)}</p>
                    <p className="text-xs text-muted-foreground">/ {formatCurrency(target)}</p>
                </div>
            </div>

            {/* Progress Bar */}
            <div className="h-2.5 bg-muted/30 rounded-full overflow-hidden">
                <div
                    className="h-full rounded-full transition-all duration-1000 relative"
                    style={{
                        width: `${Math.min(100, progress)}%`,
                        backgroundColor: displayColor
                    }}
                >
                    {/* Shimmer effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" />
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center justify-between mt-2">
                <div className="flex items-center gap-1 text-xs">
                    {isAhead ? (
                        <span className="text-emerald-600 font-semibold flex items-center gap-1">
                            <TrendingUp size={12} /> Vượt mục tiêu!
                        </span>
                    ) : isBehind ? (
                        <span className="text-red-500 font-semibold flex items-center gap-1">
                            <AlertCircle size={12} /> Cần tăng tốc
                        </span>
                    ) : (
                        <span className="text-muted-foreground">{progress}% hoàn thành</span>
                    )}
                </div>
                <span className="text-xs font-medium text-muted-foreground">
                    còn {formatCurrency(Math.max(0, target - current))}
                </span>
            </div>
        </div>
    );
}

// Mini Stat Card
function MiniStat({ label, value, icon: Icon, color }) {
    return (
        <div className="flex items-center gap-3 p-3 rounded-xl bg-muted/30">
            <div
                className="w-9 h-9 rounded-lg flex items-center justify-center"
                style={{ backgroundColor: `${color}15` }}
            >
                <Icon size={18} style={{ color }} />
            </div>
            <div>
                <p className="text-xs text-muted-foreground">{label}</p>
                <p className="text-sm font-bold text-foreground">{value}</p>
            </div>
        </div>
    );
}

export function GoalProgressWidget({
    revenueGoal = 200000000,
    studentsGoal = 50,
    currentRevenue = 0,
    currentStudents = 0,
    loading = false
}) {
    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-40 bg-muted rounded mb-6" />
                <div className="flex items-center gap-6">
                    <div className="w-[140px] h-[140px] bg-muted rounded-full" />
                    <div className="flex-1 space-y-4">
                        <div className="h-24 bg-muted rounded-xl" />
                        <div className="h-24 bg-muted rounded-xl" />
                    </div>
                </div>
            </div>
        );
    }

    const revenueProgress = calculateProgress(currentRevenue, revenueGoal);
    const studentsProgress = calculateProgress(currentStudents, studentsGoal);
    const overallProgress = Math.round((revenueProgress + studentsProgress) / 2);
    const daysRemaining = getDaysRemaining();

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-border overflow-hidden">
            {/* Header with gradient */}
            <div className="bg-gradient-to-r from-orange-500/10 via-amber-500/5 to-transparent p-6 pb-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg shadow-orange-500/20">
                            <Target size={22} className="text-white" />
                        </div>
                        <div>
                            <h3 className="text-lg font-bold text-foreground">Mục tiêu tháng</h3>
                            <p className="text-sm text-muted-foreground">Tháng {new Date().getMonth() + 1}/{new Date().getFullYear()}</p>
                        </div>
                    </div>

                    {/* Days remaining badge */}
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400">
                        <Calendar size={14} />
                        <span className="text-xs font-semibold">Còn {daysRemaining} ngày</span>
                    </div>
                </div>
            </div>

            {/* Main Content */}
            <div className="p-6 pt-4">
                <div className="flex flex-col xl:flex-row items-center gap-6">
                    {/* Progress Ring Section */}
                    <div className="flex flex-col items-center gap-3">
                        <ProgressRing progress={overallProgress} size={140} />

                        {/* Mini stats under ring */}
                        <div className="flex gap-2 w-full">
                            <MiniStat
                                label="Doanh thu"
                                value={`${revenueProgress}%`}
                                icon={Zap}
                                color="#f97316"
                            />
                            <MiniStat
                                label="Học viên"
                                value={`${studentsProgress}%`}
                                icon={TrendingUp}
                                color="#3b82f6"
                            />
                        </div>
                    </div>

                    {/* Goal Items */}
                    <div className="flex-1 space-y-4 w-full">
                        <GoalItem
                            label="Doanh thu"
                            icon={Zap}
                            current={currentRevenue}
                            target={revenueGoal}
                            color="#f97316"
                            accentBg="bg-orange-50/50 dark:bg-orange-950/20"
                        />
                        <GoalItem
                            label="Học viên mới"
                            icon={TrendingUp}
                            current={currentStudents}
                            target={studentsGoal}
                            color="#3b82f6"
                            accentBg="bg-blue-50/50 dark:bg-blue-950/20"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}

export default GoalProgressWidget;
