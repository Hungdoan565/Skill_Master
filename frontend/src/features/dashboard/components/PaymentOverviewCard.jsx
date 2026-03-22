import { Receipt, AlertTriangle, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MultiCircularProgress } from './CircularProgress';

export function PaymentOverviewCard({ data, loading = false }) {
    const navigate = useNavigate();

    if (loading) {
        return (
            <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-6">
                <div className="animate-pulse">
                    <div className="h-5 w-32 bg-gray-200 rounded mb-4" />
                    <div className="h-40 bg-gray-50 rounded-xl mb-4" />
                    <div className="space-y-3">
                        {[...Array(3)].map((_, i) => (
                            <div key={i} className="h-12 bg-gray-50 rounded-xl" />
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    if (!data) return null;

    const { counts, amounts, overdueAlert } = data;
    const total = counts?.total || 1; // Avoid divide by zero

    const progressItems = [
        {
            label: 'Đã hoàn tất',
            value: Math.round(((counts?.paid || 0) / total) * 100),
            sublabel: counts?.paid + ' hóa đơn',
            color: 'green'
        },
        {
            label: 'Chờ xử lý',
            value: Math.round(((counts?.pending || 0) / total) * 100),
            sublabel: counts?.pending + ' hóa đơn',
            color: 'blue'
        },
        {
            label: 'Quá hạn',
            value: Math.round(((counts?.overdue || 0) / total) * 100),
            sublabel: counts?.overdue + ' hóa đơn',
            color: 'red'
        }
    ];

    const statsItems = [
        {
            label: 'Tổng tiền đã thu',
            value: amounts?.totalPaidFormatted || '0đ',
            color: 'text-emerald-600',
            bgColor: 'bg-emerald-50'
        },
        {
            label: 'Tiền đang chờ',
            value: amounts?.totalPendingFormatted || '0đ',
            color: 'text-blue-600',
            bgColor: 'bg-blue-50'
        },
        {
            label: 'Tiền quá hạn',
            value: amounts?.totalOverdueFormatted || '0đ',
            color: 'text-red-600',
            bgColor: 'bg-red-50'
        }
    ];

    return (
        <div className="bg-card rounded-2xl shadow-sm border border-gray-100 p-6 flex flex-col h-full hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-indigo-500 flex items-center justify-center shadow-lg shadow-indigo-100">
                        <Receipt size={20} className="text-white" />
                    </div>
                    <div>
                        <h3 className="text-base font-bold text-gray-900">Tình trạng thu phí</h3>
                        <p className="text-xs text-gray-400 font-medium">Tổng {counts?.total || 0} hóa đơn</p>
                    </div>
                </div>
                <button
                    onClick={() => navigate('/admin/invoices')}
                    className="p-1.5 hover:bg-gray-50 rounded-lg transition-colors text-gray-400 hover:text-indigo-600"
                >
                    <ChevronRight size={20} />
                </button>
            </div>

            {/* Visual Progress Section */}
            <div className="bg-gray-50/50 rounded-2xl p-4 mb-6 ring-1 ring-gray-100/50">
                <MultiCircularProgress items={progressItems} size={70} />
            </div>

            {/* Alert Banner */}
            {overdueAlert && (
                <div className="flex items-center gap-2 p-3 mb-6 bg-red-50 border border-red-100 rounded-xl animate-in fade-in slide-in-from-top-2">
                    <AlertTriangle size={16} className="text-red-500" />
                    <span className="text-xs text-red-700 font-bold">
                        {counts?.overdue || 0} hóa đơn quá hạn cần lưu ý!
                    </span>
                </div>
            )}

            {/* List Stats */}
            <div className="space-y-3 mt-auto">
                {statsItems.map((item, index) => (
                    <div
                        key={index}
                        className="flex items-center justify-between p-3 rounded-xl border border-transparent hover:border-gray-100 hover:bg-gray-50/50 transition-all group"
                    >
                        <span className="text-sm font-medium text-gray-500">{item.label}</span>
                        <div className="text-right">
                            <p className={`text-sm font-heavy ${item.color} tabular-nums`}>{item.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Actions */}
            <button
                onClick={() => navigate('/admin/invoices')}
                className="mt-6 w-full py-2.5 bg-gray-900 text-white rounded-xl text-sm font-bold hover:bg-gray-800 transition-colors shadow-sm"
            >
                Quản lý hóa đơn
            </button>
        </div>
    );
}

export default PaymentOverviewCard;

