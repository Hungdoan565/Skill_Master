/**
 * CenterQuickStats Component - Quick stats cards cho Center Detail
 * 
 * Hybrid Navigation:
 * - Click card body → Chuyển tab nội bộ
 * - Click icon [↗] → Navigate ra admin page (filter sẵn center)
 */

import React from 'react';
import { useNavigate } from 'react-router-dom';
import {
    Building2,
    BookOpen,
    Users,
    GraduationCap,
    DollarSign,
    ExternalLink
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CenterQuickStats({
    stats,
    centerId,
    loading = false,
    onTabChange  // Callback để chuyển tab nội bộ
}) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {[1, 2, 3, 4, 5].map(i => (
                    <Card key={i} className="p-4">
                        <div className="animate-pulse">
                            <div className="h-10 w-10 bg-gray-200 rounded-lg mb-3" />
                            <div className="h-6 w-12 bg-gray-200 rounded mb-2" />
                            <div className="h-4 w-20 bg-gray-200 rounded" />
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Phòng học',
            value: stats?.rooms?.total ?? stats?.rooms ?? 0,
            sub: `${stats?.rooms?.active ?? 0} hoạt động`,
            icon: Building2,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50',
            hoverBg: 'hover:bg-blue-50/50',
            tabKey: 'rooms',
            externalUrl: `/admin/rooms?center=${centerId}`
        },
        {
            title: 'Lớp học',
            value: stats?.classes?.total ?? stats?.classes ?? 0,
            sub: `${stats?.classes?.ongoing ?? stats?.classes?.active ?? 0} đang học`,
            icon: BookOpen,
            color: 'text-green-600',
            bgColor: 'bg-green-50',
            hoverBg: 'hover:bg-green-50/50',
            tabKey: 'classes',
            externalUrl: `/admin/classes?centerId=${centerId}`
        },
        {
            title: 'Giáo viên',
            value: stats?.staff?.teachers ?? stats?.teachers ?? 0,
            sub: `Nhân sự: ${stats?.staff?.total ?? 0}`,
            icon: Users,
            color: 'text-purple-600',
            bgColor: 'bg-purple-50',
            hoverBg: 'hover:bg-purple-50/50',
            tabKey: 'staff',
            externalUrl: `/admin/staff?centerId=${centerId}`
        },
        {
            title: 'Học viên',
            value: stats?.students?.total ?? stats?.students ?? 0,
            sub: 'Đang theo học',
            icon: GraduationCap,
            color: 'text-amber-600',
            bgColor: 'bg-amber-50',
            hoverBg: 'hover:bg-amber-50/50',
            tabKey: null, // Không có tab riêng, luôn navigate
            externalUrl: `/admin/students?centerId=${centerId}`
        },
        {
            title: 'Doanh thu tháng',
            value: formatCurrency(stats?.revenue?.monthly ?? 0),
            sub: `${stats?.revenue?.invoiceCount ?? 0} hóa đơn`,
            icon: DollarSign,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50',
            hoverBg: 'hover:bg-emerald-50/50',
            tabKey: 'revenue',
            externalUrl: `/admin/invoices?centerId=${centerId}`
        }
    ];

    // Handle click on card body - chuyển tab nội bộ
    const handleCardClick = (card) => {
        if (card.tabKey && onTabChange) {
            onTabChange(card.tabKey);
        } else {
            // Không có tab tương ứng → navigate ra ngoài
            navigate(card.externalUrl);
        }
    };

    // Handle click on external icon - navigate ra admin page
    const handleExternalClick = (e, url) => {
        e.stopPropagation(); // Ngăn trigger card click
        navigate(url);
    };

    return (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card
                        key={index}
                        className={`p-4 transition-all cursor-pointer group border-2 border-transparent hover:border-gray-100 hover:shadow-md ${card.hoverBg}`}
                        onClick={() => handleCardClick(card)}
                    >
                        <div className="flex items-start justify-between mb-3">
                            <div className={`p-2.5 rounded-xl ${card.bgColor} transition-transform group-hover:scale-110`}>
                                <Icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                            {/* External link icon */}
                            <button
                                onClick={(e) => handleExternalClick(e, card.externalUrl)}
                                className="p-1.5 rounded-lg text-gray-300 hover:text-gray-600 hover:bg-gray-100 transition-all opacity-0 group-hover:opacity-100"
                                title={`Mở trang quản lý ${card.title}`}
                            >
                                <ExternalLink className="h-4 w-4" />
                            </button>
                        </div>
                        <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                        <p className="text-sm font-medium text-gray-700">{card.title}</p>
                        <p className="text-xs text-gray-400 mt-1">{card.sub}</p>
                    </Card>
                );
            })}
        </div>
    );
}

// Helper format currency
function formatCurrency(amount) {
    if (amount >= 1000000) {
        return `${(amount / 1000000).toFixed(1)}M`;
    }
    if (amount >= 1000) {
        return `${(amount / 1000).toFixed(0)}K`;
    }
    return amount?.toLocaleString() || '0';
}

export default CenterQuickStats;
