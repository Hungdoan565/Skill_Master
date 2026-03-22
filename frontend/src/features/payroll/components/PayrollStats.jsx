/**
 * PayrollStats Component
 * Thẻ thống kê nhanh cho payroll
 */

import { DollarSign, FileText, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { formatCurrency, formatMonthYear } from '../utils';

export function PayrollStats({ stats, loading }) {
    if (loading) {
        return (
            <div className="grid gap-4 md:grid-cols-4">
                {[1, 2, 3, 4].map((i) => (
                    <Card key={i}>
                        <CardContent className="p-6">
                            <div className="h-16 bg-muted animate-pulse rounded" />
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    const cards = [
        {
            title: 'Tổng bảng lương',
            value: stats?.total_payrolls || 0,
            icon: FileText,
            color: 'text-blue-600',
            bg: 'bg-blue-500/10',
            subtitle: `Tháng ${stats?.month}/${stats?.year}`,
        },
        {
            title: 'Chờ xử lý',
            value: (stats?.draft || 0) + (stats?.pending || 0),
            icon: Clock,
            color: 'text-orange-600',
            bg: 'bg-orange-500/10',
            subtitle: `${stats?.draft || 0} nháp, ${stats?.pending || 0} chờ duyệt`,
        },
        {
            title: 'Đã thanh toán',
            value: stats?.paid || 0,
            icon: CheckCircle,
            color: 'text-green-600',
            bg: 'bg-green-500/10',
            subtitle: formatCurrency(stats?.paid_amount || 0),
        },
        {
            title: 'Tổng chi',
            value: formatCurrency(stats?.total_amount || 0),
            icon: DollarSign,
            color: 'text-indigo-600',
            bg: 'bg-indigo-500/10',
            subtitle: `Còn ${formatCurrency(stats?.pending_amount || 0)} chưa trả`,
        },
    ];

    return (
        <div className="grid gap-4 md:grid-cols-4">
            {cards.map((card, index) => (
                <Card key={index} className="overflow-hidden">
                    <CardContent className="p-6">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="text-sm font-medium text-muted-foreground">
                                    {card.title}
                                </p>
                                <p className="mt-1 text-2xl font-bold">{card.value}</p>
                                <p className="mt-1 text-xs text-muted-foreground">
                                    {card.subtitle}
                                </p>
                            </div>
                            <div className={`rounded-lg p-2 ${card.bg}`}>
                                <card.icon className={`h-5 w-5 ${card.color}`} />
                            </div>
                        </div>
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}

export default PayrollStats;
