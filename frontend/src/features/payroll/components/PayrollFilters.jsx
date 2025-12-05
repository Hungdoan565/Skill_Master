/**
 * PayrollFilters Component
 * Bộ lọc cho trang payroll
 */

import { Search, Filter } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getMonthOptions, getYearOptions, getCurrentMonth } from '../utils';

export function PayrollFilters({
    month,
    year,
    status,
    onMonthChange,
    onYearChange,
    onStatusChange,
    searchTerm,
    onSearchChange,
}) {
    const months = getMonthOptions(year);
    const years = getYearOptions();

    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái' },
        { value: 'draft', label: '📝 Nháp' },
        { value: 'pending', label: '⏳ Chờ duyệt' },
        { value: 'approved', label: '✅ Đã duyệt' },
        { value: 'paid', label: '💰 Đã thanh toán' },
    ];

    return (
        <div className="flex flex-wrap items-center gap-4">
            {/* Search */}
            <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <Input
                    placeholder="Tìm theo tên giáo viên..."
                    value={searchTerm}
                    onChange={(e) => onSearchChange(e.target.value)}
                    className="pl-10"
                />
            </div>

            {/* Month filter */}
            <select
                value={month}
                onChange={(e) => onMonthChange(parseInt(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {months.map((m) => (
                    <option key={m.value} value={m.value}>
                        {m.label}
                    </option>
                ))}
            </select>

            {/* Year filter */}
            <select
                value={year}
                onChange={(e) => onYearChange(parseInt(e.target.value))}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {years.map((y) => (
                    <option key={y.value} value={y.value}>
                        {y.label}
                    </option>
                ))}
            </select>

            {/* Status filter */}
            <select
                value={status}
                onChange={(e) => onStatusChange(e.target.value)}
                className="h-10 rounded-md border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
            >
                {statusOptions.map((s) => (
                    <option key={s.value} value={s.value}>
                        {s.label}
                    </option>
                ))}
            </select>
        </div>
    );
}

export default PayrollFilters;
