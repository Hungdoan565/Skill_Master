/**
 * TeachersPayrollTable Component
 * Bảng danh sách giáo viên với thống kê giờ dạy và nút tạo bảng lương
 */

import { User, Clock, DollarSign, Plus, Eye, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { formatCurrency, formatHours, getPayrollStatusLabel, getPayrollStatusColor } from '../utils';

export function TeachersPayrollTable({
    teachers = [],
    onGeneratePayroll,
    onViewPayroll,
    loading,
}) {
    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="h-20 bg-muted animate-pulse rounded-lg" />
                ))}
            </div>
        );
    }

    if (teachers.length === 0) {
        return (
            <div className="flex h-40 flex-col items-center justify-center gap-2 text-muted-foreground">
                <User className="h-10 w-10" />
                <p>Không có giáo viên nào</p>
            </div>
        );
    }

    return (
        <div className="overflow-x-auto">
            <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
                <thead>
                    <tr className="border-b text-left text-sm font-medium text-muted-foreground">
                        <th className="pb-3 pr-4">Giáo viên</th>
                        <th className="pb-3 pr-4 text-center">Số buổi</th>
                        <th className="pb-3 pr-4 text-center">Tổng giờ</th>
                        <th className="pb-3 pr-4 text-right">Lương cơ bản</th>
                        <th className="pb-3 pr-4 text-center">Trạng thái</th>
                        <th className="pb-3 text-right">Hành động</th>
                    </tr>
                </thead>
                <tbody>
                    {teachers.map((teacher) => (
                        <tr
                            key={teacher.id}
                            className="border-b last:border-0 hover:bg-muted/50 transition-colors"
                        >
                            {/* Teacher Info */}
                            <td className="py-4 pr-4">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 font-medium">
                                        {teacher.full_name?.charAt(0)?.toUpperCase() || 'T'}
                                    </div>
                                    <div>
                                        <p className="font-medium text-foreground">
                                            {teacher.full_name || 'Chưa cập nhật'}
                                        </p>
                                        <p className="text-xs text-muted-foreground">
                                            {formatCurrency(teacher.hourly_rate || 150000)}/giờ
                                        </p>
                                    </div>
                                </div>
                            </td>

                            {/* Sessions */}
                            <td className="py-4 pr-4 text-center">
                                <span className="inline-flex items-center gap-1">
                                    <FileText className="h-4 w-4 text-muted-foreground" />
                                    {teacher.total_sessions || 0}
                                </span>
                            </td>

                            {/* Hours */}
                            <td className="py-4 pr-4 text-center">
                                <span className="inline-flex items-center gap-1">
                                    <Clock className="h-4 w-4 text-muted-foreground" />
                                    {formatHours(teacher.total_hours || 0)}
                                </span>
                            </td>

                            {/* Base Salary */}
                            <td className="py-4 pr-4 text-right">
                                <span className="font-medium text-green-600">
                                    {formatCurrency(teacher.base_salary || 0)}
                                </span>
                            </td>

                            {/* Status */}
                            <td className="py-4 pr-4 text-center">
                                {teacher.payroll ? (
                                    <Badge variant={getPayrollStatusColor(teacher.payroll.status)}>
                                        {getPayrollStatusLabel(teacher.payroll.status)}
                                    </Badge>
                                ) : teacher.total_sessions > 0 ? (
                                    <Badge variant="outline">Chưa tạo</Badge>
                                ) : (
                                    <Badge variant="secondary">Không có dữ liệu</Badge>
                                )}
                            </td>

                            {/* Actions */}
                            <td className="py-4 text-right">
                                {teacher.payroll ? (
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => onViewPayroll(teacher.payroll)}
                                    >
                                        <Eye className="mr-1 h-4 w-4" />
                                        Xem
                                    </Button>
                                ) : teacher.total_sessions > 0 ? (
                                    <Button
                                        size="sm"
                                        onClick={() => onGeneratePayroll(teacher)}
                                    >
                                        <Plus className="mr-1 h-4 w-4" />
                                        Tạo bảng lương
                                    </Button>
                                ) : (
                                    <span className="text-sm text-muted-foreground">--</span>
                                )}
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
}

export default TeachersPayrollTable;
