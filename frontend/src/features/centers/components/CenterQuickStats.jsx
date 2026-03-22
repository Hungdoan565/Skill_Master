/**
 * CenterQuickStats Component - Quick stats cards acting as Tab Navigation for Center Detail
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    LayoutDashboard,
    Building2,
    BookOpen,
    Users,
    GraduationCap,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export function CenterQuickStats({
    stats,
    centerId,
    loading = false,
    activeTab,
    onTabChange
}) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
                {[1, 2, 3, 4, 5, 6].map(i => (
                    <Card key={i} className="p-3 shadow-sm border-gray-200 dark:border-zinc-800 h-[104px]">
                        <div className="animate-pulse flex flex-col h-full justify-between">
                            <div className="flex justify-between items-start">
                                <div className="h-8 w-8 bg-muted rounded-lg" />
                                <div className="h-4 w-4 bg-muted rounded" />
                            </div>
                            <div>
                                <div className="h-5 w-12 bg-muted rounded mb-1" />
                                <div className="h-3 w-20 bg-muted rounded" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Tổng quan',
            value: '',
            sub: 'Thông tin chung',
            icon: LayoutDashboard,
            color: 'text-gray-700 dark:text-gray-300',
            bgColor: 'bg-gray-100 dark:bg-gray-800',
            highlightRing: 'ring-gray-900',
            tabKey: 'overview',
            externalUrl: null
        },
        {
            title: 'Lớp học',
            value: stats?.classes?.total ?? stats?.classes ?? 0,
            sub: `${stats?.classes?.ongoing ?? stats?.classes?.active ?? 0} đang học`,
            icon: BookOpen,
            color: 'text-indigo-600',
            bgColor: 'bg-indigo-50 dark:bg-indigo-900',
            highlightRing: 'ring-indigo-600',
            tabKey: 'classes',
            externalUrl: `/admin/classes?centerId=${centerId}`
        },
        {
            title: 'Phòng học',
            value: stats?.rooms?.total ?? stats?.rooms ?? 0,
            sub: `${stats?.rooms?.active ?? 0} hoạt động`,
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50 dark:bg-blue-900',
            highlightRing: 'ring-blue-600',
            tabKey: 'rooms',
            externalUrl: `/admin/rooms?center=${centerId}`
        },
        {
            title: 'Nhân sự',
            value: stats?.staff?.teachers ?? stats?.teachers ?? 0,
            sub: `Tổng số: ${stats?.staff?.total ?? 0}`,
            icon: Users,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50 dark:bg-amber-900',
            highlightRing: 'ring-amber-500',
            tabKey: 'staff',
            externalUrl: `/admin/staff?centerId=${centerId}`
        },
        {
            title: 'Học viên',
            value: stats?.students?.total ?? stats?.students ?? 0,
            sub: 'Đang theo học',
            icon: GraduationCap,
            color: 'text-fuchsia-600',
            bgColor: 'bg-fuchsia-50 dark:bg-fuchsia-900',
            highlightRing: 'ring-fuchsia-500',
            tabKey: 'students',
            externalUrl: `/admin/students?centerId=${centerId}`
        },
        {
            title: 'Doanh thu',
            value: formatCurrency(stats?.revenue?.monthly ?? 0),
            sub: 'Tháng này',
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50 dark:bg-emerald-900',
            highlightRing: 'ring-emerald-500',
            tabKey: 'revenue',
            externalUrl: `/admin/invoices?centerId=${centerId}`
        }
    ];

    const handleCardClick = (card) => {
        if (card.tabKey && onTabChange) {
            onTabChange(card.tabKey);
        } else if (card.externalUrl) {
            navigate(card.externalUrl);
        }
    };

    const handleExternalClick = (e, url) => {
        e.stopPropagation();
        if (url) navigate(url);
    };

    return (
        <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">
            {cards.map((card, index) => {
                const Icon = card.icon;
                const isActive = activeTab === card.tabKey;
                
                return (
                    <Card
                        key={index}
                        className={cn(
                            "relative overflow-hidden transition-all duration-200 cursor-pointer group shadow-sm border",
                            "hover:shadow-md hover:border-gray-200 dark:border-zinc-800",
                            isActive 
                                ? `ring-1 ring-offset-0 ${card.highlightRing} border-transparent bg-white dark:bg-zinc-900 shadow-md` 
                                : "border-gray-200 dark:border-zinc-800 bg-white dark:bg-zinc-900"
                        )}
                        onClick={() => handleCardClick(card)}
                    >
                        {/* Active indicator bar */}
                        {isActive && (
                            <div className={cn("absolute left-0 top-0 bottom-0 w-1", card.bgColor.replace('bg-', 'bg-').replace('/80', '').replace('-50', '-500'))} />
                        )}
                        
                        <div className={cn("p-3.5", isActive && "pl-4.5")}>
                            <div className="flex items-start justify-between mb-2">
                                <div className={cn(
                                    "p-2 rounded-lg transition-transform duration-300",
                                    card.bgColor,
                                    isActive ? "scale-110" : "group-hover:scale-105"
                                )}>
                                    <Icon className={cn("h-4 w-4", card.color)} />
                                </div>
                                
                                {card.externalUrl && (
                                    <button
                                        onClick={(e) => handleExternalClick(e, card.externalUrl)}
                                        className={cn(
                                            "p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
                                            !isActive && "opacity-0 group-hover:opacity-100"
                                        )}
                                        title={`Quản lý ${card.title.toLowerCase()}`}
                                    >
                                        <ExternalLink className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            
                            <div>
                                {card.value !== '' ? (
                                    <div className="flex items-baseline gap-1.5">
                                        <h3 className="text-xl font-bold text-foreground">{card.value}</h3>
                                        <p className="text-xs font-medium text-muted-foreground truncate">{card.title}</p>
                                    </div>
                                ) : (
                                    <h3 className="text-sm font-bold text-foreground mt-1 mb-0.5">{card.title}</h3>
                                )}
                                <p className="text-xs text-muted-foreground mt-0.5 truncate">{card.sub}</p>
                            </div>
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

function formatCurrency(amount) {
    if (!amount) return '0';
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount.toLocaleString('vi-VN');
}

export default CenterQuickStats;
