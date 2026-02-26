/**
 * HolidayTable - Bảng hiển thị danh sách ngày lễ
 */

import { Pencil, Trash2, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function HolidayTable({ holidays, loading, onEdit, onDelete, onRefresh }) {
    const formatDate = (dateStr) => {
        if (!dateStr) return '';
        const date = new Date(dateStr);
        return date.toLocaleDateString('vi-VN', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    if (loading) {
        return (
            <div className="bg-white rounded-xl border overflow-hidden">
                <div className="animate-pulse">
                    <div className="h-12 bg-gray-100 border-b" />
                    {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="h-16 border-b flex items-center px-6 gap-4">
                            <div className="h-4 bg-gray-200 rounded w-24" />
                            <div className="h-4 bg-gray-200 rounded w-40" />
                            <div className="h-4 bg-gray-200 rounded w-60 flex-1" />
                            <div className="h-6 bg-gray-200 rounded w-16" />
                            <div className="h-4 bg-gray-200 rounded w-32" />
                            <div className="h-8 bg-gray-200 rounded w-20" />
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    if (!holidays || holidays.length === 0) {
        return (
            <div className="bg-white rounded-xl border p-12 text-center">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Chưa có ngày lễ nào</h3>
                <p className="text-gray-500 mb-4">Thêm ngày lễ để quản lý lịch nghỉ của trung tâm</p>
                <Button variant="outline" onClick={onRefresh}>
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Làm mới
                </Button>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border overflow-hidden">
            <div className="overflow-x-auto">
                <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                    <thead>
                        <tr className="bg-gray-50 border-b">
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Ngày
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Tên ngày lễ
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Mô tả
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Lặp lại
                            </th>
                            <th className="text-left px-6 py-3 text-sm font-medium text-gray-500">
                                Người tạo
                            </th>
                            <th className="text-right px-6 py-3 text-sm font-medium text-gray-500">
                                Hành động
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y">
                        {holidays.map((holiday) => (
                            <tr key={holiday.id} className="hover:bg-gray-50 transition-colors">
                                <td className="px-6 py-4">
                                    <span className="font-medium text-gray-900">
                                        {formatDate(holiday.date)}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-900">{holiday.name}</span>
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-500 text-sm line-clamp-2">
                                        {holiday.description || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    {holiday.is_recurring ? (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Có
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                            Không
                                        </span>
                                    )}
                                </td>
                                <td className="px-6 py-4">
                                    <span className="text-gray-600 text-sm">
                                        {holiday.creator?.full_name || '-'}
                                    </span>
                                </td>
                                <td className="px-6 py-4">
                                    <div className="flex items-center justify-end gap-2">
                                        <button
                                            onClick={() => onEdit(holiday)}
                                            className="p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Chỉnh sửa"
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </button>
                                        <button
                                            onClick={() => onDelete(holiday)}
                                            className="p-2 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Xóa"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default HolidayTable;
