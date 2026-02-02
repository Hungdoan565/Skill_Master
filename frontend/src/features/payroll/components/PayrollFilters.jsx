/**
 * PayrollFilters Component
 * Bộ lọc cho trang payroll - đồng bộ style với admin
 */

import { useState, useRef, useEffect } from 'react';
import { Search, ChevronDown, Calendar, Clock, CheckCircle, DollarSign, Filter, FileText } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { getMonthOptions, getYearOptions } from '../utils';

// Custom Select Component với icon Lucide
function IconSelect({ value, onChange, options, placeholder, icon: Icon }) {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef(null);
    
    const selectedOption = options.find(opt => opt.value === value);
    
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div ref={containerRef} className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-2 h-10 px-3 rounded-md border border-input bg-white hover:bg-slate-50 transition-colors text-sm min-w-[140px] justify-between"
            >
                <div className="flex items-center gap-2">
                    {Icon && <Icon className="h-4 w-4 text-slate-500" />}
                    <span className={selectedOption?.color || ''}>
                        {selectedOption?.label || placeholder}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
            </button>
            
            {isOpen && (
                <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-md border shadow-lg z-50 py-1">
                    {options.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                                value === option.value ? 'bg-slate-50 font-medium' : ''
                            }`}
                        >
                            {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-slate-500'}`} />}
                            <span className={option.color || ''}>{option.label}</span>
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}

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

    // Status options với Lucide icons thay vì emoji
    const statusOptions = [
        { value: '', label: 'Tất cả trạng thái', icon: Filter, iconColor: 'text-slate-400' },
        { value: 'draft', label: 'Nháp', icon: FileText, iconColor: 'text-slate-500' },
        { value: 'pending', label: 'Chờ duyệt', icon: Clock, iconColor: 'text-orange-500' },
        { value: 'approved', label: 'Đã duyệt', icon: CheckCircle, iconColor: 'text-green-500' },
        { value: 'paid', label: 'Đã thanh toán', icon: DollarSign, iconColor: 'text-blue-500' },
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
            <IconSelect
                value={month}
                onChange={onMonthChange}
                options={months}
                placeholder="Chọn tháng"
                icon={Calendar}
            />

            {/* Year filter */}
            <IconSelect
                value={year}
                onChange={onYearChange}
                options={years}
                placeholder="Chọn năm"
                icon={Calendar}
            />

            {/* Status filter */}
            <IconSelect
                value={status}
                onChange={onStatusChange}
                options={statusOptions}
                placeholder="Trạng thái"
                icon={Filter}
            />
        </div>
    );
}

export default PayrollFilters;
