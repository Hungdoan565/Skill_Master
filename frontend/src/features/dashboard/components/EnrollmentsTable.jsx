/**
 * EnrollmentsTable Component
 * Clean table for recent enrollments with status badges
 * Based on Tirmary design reference
 */

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Users, ExternalLink } from 'lucide-react';

const STATUS_STYLES = {
    paid: {
        bg: 'bg-emerald-100 dark:bg-emerald-900/30',
        text: 'text-emerald-700 dark:text-emerald-400',
        label: 'Đã thanh toán'
    },
    partial: {
        bg: 'bg-blue-100 dark:bg-blue-900/30',
        text: 'text-blue-700 dark:text-blue-400',
        label: 'Thanh toán một phần'
    },
    pending: {
        bg: 'bg-amber-100 dark:bg-amber-900/30',
        text: 'text-amber-700 dark:text-amber-400',
        label: 'Chờ thanh toán'
    },
    overdue: {
        bg: 'bg-red-100 dark:bg-red-900/30',
        text: 'text-red-700 dark:text-red-400',
        label: 'Quá hạn'
    },
    cancelled: {
        bg: 'bg-gray-100 dark:bg-gray-800',
        text: 'text-gray-600 dark:text-gray-400',
        label: 'Đã hủy'
    }
};

const formatDate = (dateStr) => {
    if (!dateStr) return 'N/A';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
};

const formatCurrency = (amount) => {
    if (!amount) return '0đ';
    return new Intl.NumberFormat('vi-VN').format(amount) + 'đ';
};

export function EnrollmentsTable({ data = [], loading = false, itemsPerPage = 5 }) {
    const navigate = useNavigate();
    const [currentPage, setCurrentPage] = useState(1);

    if (loading) {
        return (
            <div className="bg-card rounded-2xl p-6 shadow-sm border border-border animate-pulse">
                <div className="h-6 w-48 bg-muted rounded mb-6" />
                <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-muted rounded-full" />
                            <div className="flex-1">
                                <div className="h-4 w-32 bg-muted rounded mb-2" />
                                <div className="h-3 w-48 bg-muted rounded" />
                            </div>
                            <div className="h-6 w-24 bg-muted rounded-full" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    const totalPages = Math.ceil(data.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const paginatedData = data.slice(startIndex, startIndex + itemsPerPage);

    const getInitials = (name) => {
        if (!name || name === 'N/A') return '?';
        const parts = name.split(' ');
        if (parts.length >= 2) {
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
        }
        return name.substring(0, 2).toUpperCase();
    };

    return (
        <div className="bg-card rounded-2xl p-6 shadow-sm border border-border h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <h3 className="text-lg font-bold text-foreground">Ghi danh gần đây</h3>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        {data.length} học viên
                    </p>
                </div>
                <button
                    onClick={() => navigate('/admin/enrollments')}
                    className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1"
                >
                    Xem tất cả
                    <ExternalLink size={14} />
                </button>
            </div>

            {/* Table */}
            {data.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground py-12">
                    <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                        <Users size={28} />
                    </div>
                    <p className="text-sm font-medium">Chưa có ghi danh nào</p>
                    <p className="text-xs mt-1">Học viên mới sẽ hiển thị ở đây</p>
                </div>
            ) : (
                <>
                    {/* Table Header */}
                    <div className="hidden md:grid grid-cols-12 gap-4 px-4 py-3 bg-muted/50 rounded-xl text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                        <div className="col-span-4">Học viên</div>
                        <div className="col-span-3">Khóa học</div>
                        <div className="col-span-2">Ngày</div>
                        <div className="col-span-3 text-right">Trạng thái</div>
                    </div>

                    {/* Table Body */}
                    <div className="flex-1 space-y-2">
                        {paginatedData.map((item, index) => {
                            const status = STATUS_STYLES[item.status] || STATUS_STYLES.pending;
                            const studentName = item.student_name || item.name || item.full_name || 'N/A';

                            return (
                                <div
                                    key={item.id || index}
                                    className="grid grid-cols-12 gap-4 px-4 py-3 rounded-xl hover:bg-muted/50 transition-colors items-center"
                                >
                                    {/* Student */}
                                    <div className="col-span-12 md:col-span-4 flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                                            <span className="text-sm font-bold text-primary">
                                                {getInitials(studentName)}
                                            </span>
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-medium text-foreground truncate">{studentName}</p>
                                            <p className="text-xs text-muted-foreground md:hidden">
                                                {item.course_name || 'N/A'}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Course */}
                                    <div className="hidden md:block col-span-3">
                                        <p className="text-sm text-foreground truncate">
                                            {item.course_name || 'N/A'}
                                        </p>
                                    </div>

                                    {/* Date */}
                                    <div className="hidden md:block col-span-2">
                                        <p className="text-sm text-muted-foreground">
                                            {formatDate(item.created_at || item.enrolled_at)}
                                        </p>
                                    </div>

                                    {/* Status */}
                                    <div className="col-span-12 md:col-span-3 flex justify-start md:justify-end">
                                        <span className={`
                      inline-flex px-3 py-1 rounded-full text-xs font-semibold
                      ${status.bg} ${status.text}
                    `}>
                                            {status.label}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Pagination */}
                    {totalPages > 1 && (
                        <div className="flex items-center justify-center gap-2 pt-4 mt-4 border-t border-border">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronLeft size={16} />
                            </button>

                            <div className="flex items-center gap-1">
                                {[...Array(totalPages)].map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => setCurrentPage(i + 1)}
                                        className={`
                      w-8 h-8 rounded-lg text-sm font-medium transition-colors
                      ${currentPage === i + 1
                                                ? 'bg-primary text-primary-foreground'
                                                : 'hover:bg-muted text-muted-foreground'
                                            }
                    `}
                                    >
                                        {i + 1}
                                    </button>
                                ))}
                            </div>

                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className="p-2 rounded-lg hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

export default EnrollmentsTable;
