/**
 * CenterStatsCards Component - Hiển thị thống kê tổng quan
 */

import React from 'react';
import {
    Building2,
    MapPin,
    Users,
    GraduationCap,
    TrendingUp,
    TrendingDown,
    Minus
} from 'lucide-react';
import { Card } from '@/components/ui/card';

export function CenterStatsCards({ stats, loading = false }) {
    const cards = [
        {
            title: 'Tổng trung tâm',
            value: stats?.total || 0,
            icon: Building2,
            color: 'bg-blue-500',
            lightColor: 'bg-blue-50',
            textColor: 'text-blue-600',
            subtext: `${stats?.active || 0} hoạt động`
        },
        {
            title: 'Tổng phòng học',
            value: stats?.totalRooms || 0,
            icon: MapPin,
            color: 'bg-green-500',
            lightColor: 'bg-green-50',
            textColor: 'text-green-600',
            subtext: 'Tất cả chi nhánh'
        },
        {
            title: 'Giáo viên',
            value: stats?.totalTeachers || 0,
            icon: Users,
            color: 'bg-purple-500',
            lightColor: 'bg-purple-50',
            textColor: 'text-purple-600',
            subtext: 'Đang làm việc'
        },
        {
            title: 'Học sinh',
            value: stats?.totalStudents || 0,
            icon: GraduationCap,
            color: 'bg-amber-500',
            lightColor: 'bg-amber-50',
            textColor: 'text-amber-600',
            subtext: 'Đang theo học'
        }
    ];

    if (loading) {
        return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i} className="p-6">
                        <div className="animate-pulse">
                            <div className="flex items-center justify-between">
                                <div className="w-12 h-12 bg-gray-200 rounded-xl" />
                                <div className="w-16 h-4 bg-gray-200 rounded" />
                            </div>
                            <div className="mt-4">
                                <div className="w-20 h-8 bg-gray-200 rounded mb-2" />
                                <div className="w-24 h-4 bg-gray-200 rounded" />
                            </div>
                        </div>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((card, index) => {
                const Icon = card.icon;
                return (
                    <Card key={index} className="p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between">
                            <div className={`w-12 h-12 ${card.lightColor} rounded-xl flex items-center justify-center`}>
                                <Icon className={`h-6 w-6 ${card.textColor}`} />
                            </div>
                            {card.trend !== undefined && (
                                <div className={`flex items-center gap-1 text-sm ${card.trend > 0 ? 'text-green-600' : card.trend < 0 ? 'text-red-600' : 'text-gray-500'
                                    }`}>
                                    {card.trend > 0 ? (
                                        <TrendingUp className="h-4 w-4" />
                                    ) : card.trend < 0 ? (
                                        <TrendingDown className="h-4 w-4" />
                                    ) : (
                                        <Minus className="h-4 w-4" />
                                    )}
                                    <span>{Math.abs(card.trend)}%</span>
                                </div>
                            )}
                        </div>
                        <div className="mt-4">
                            <h3 className="text-2xl font-bold text-gray-900">
                                {card.value.toLocaleString('vi-VN')}
                            </h3>
                            <p className="text-sm text-gray-500 mt-1">{card.title}</p>
                            {card.subtext && (
                                <p className="text-xs text-gray-400 mt-0.5">{card.subtext}</p>
                            )}
                        </div>
                    </Card>
                );
            })}
        </div>
    );
}

export default CenterStatsCards;
