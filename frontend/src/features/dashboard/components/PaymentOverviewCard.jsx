/**
 * PaymentOverviewCard Component
 * Hiển thị tổng quan thanh toán & hóa đơn
 */

import { Receipt, AlertTriangle, Clock, CheckCircle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export function PaymentOverviewCard({ data, loading = false }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                    <div className="grid grid-cols-2 gap-4">
                        {[...Array(4)].map((_, i) => (
                            <div key={i} className="p-3 bg-gray-50 rounded-lg">
                                <div className="h-4 w-20 bg-gray-200 rounded mb-2" />
                                <div className="h-6 w-16 bg-gray-200 rounded" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { counts, amounts, overdueAlert } = data;

    const items = [
        {
            label: 'Đã thanh toán',
            count: counts?.paid || 0,
            amount: amounts?.totalPaidFormatted || '0đ',
            icon: CheckCircle,
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Chờ thanh toán',
            count: counts?.pending || 0,
            amount: amounts?.totalPendingFormatted || '0đ',
            icon: Clock,
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Quá hạn',
            count: counts?.overdue || 0,
            amount: amounts?.totalOverdueFormatted || '0đ',
            icon: AlertTriangle,
            color: 'text-red-600',
            bgColor: 'bg-red-50',
            alert: true
        }
    ];

    return (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 flex items-center justify-center">
                        <Receipt size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="font-semibold text-gray-900">Thanh toán</h3>
                        <p className="text-xs text-gray-500">{counts?.total || 0} hóa đơn</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/invoices')}
                    className="flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                    Chi tiết
                    <ChevronRight size={16} />
                </button>
            </div>

            {/* Alert Banner */}
            {overdueAlert && (
                <div className="flex items-center gap-2 p-3 mb-4 bg-red-50 border border-red-100 rounded-lg">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-sm text-red-700 font-medium">
                        Có {counts?.overdue || 0} hóa đơn quá hạn cần xử lý
                    </span>
                </div>
            )}

            {/* Stats Grid */}
            <div className="space-y-3">
                {items.map((item, index) => (
                    <div
                        key={index}
                        className={`flex items-center justify-between p-3 rounded-xl ${item.bgColor} ${item.alert && counts?.overdue > 0 ? 'ring-1 ring-red-200' : ''
                            }`}
                    >
                        <div className="flex items-center gap-3">
                            <item.icon size={18} className={item.color} />
                            <span className="text-sm font-medium text-gray-700">{item.label}</span>
                        </div>
                        <div className="text-right">
                            <p className={`text-sm font-bold ${item.color}`}>{item.amount}</p>
                            <p className="text-xs text-gray-500">{item.count} hóa đơn</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export default PaymentOverviewCard;
