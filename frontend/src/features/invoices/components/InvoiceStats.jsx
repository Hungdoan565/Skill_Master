/**
 * InvoiceStats Component
 * 
 * Hiển thị 4 card thống kê KPI cho trang Invoices.
 * 
 * @param {Object} statistics - Data thống kê từ API
 * @param {boolean} loading - Trạng thái loading
 * @param {function} onStatusClick - Handler khi click vào card để filter
 */

import { TrendingUp, AlertCircle, Clock, CheckCircle2 } from 'lucide-react';
import { StatCard } from './StatCard';

export function InvoiceStats({ statistics, loading, onStatusClick }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {/* Tổng thu tháng này */}
      <StatCard
        title="Tổng thu tháng này"
        value={loading ? '...' : `${(statistics?.monthlyRevenue || 0).toLocaleString()}đ`}
        icon={TrendingUp}
        description={`Tổng đã thu: ${(statistics?.totalRevenue || 0).toLocaleString()}đ`}
        accentColor="emerald"
      />

      {/* Tổng còn nợ */}
      <StatCard
        title="Tổng còn nợ"
        value={loading ? '...' : `${(statistics?.totalDebt || 0).toLocaleString()}đ`}
        icon={AlertCircle}
        description={`${statistics?.counts?.unpaid || 0} hóa đơn chưa thanh toán`}
        accentColor="red"
        onClick={() => onStatusClick?.('unpaid')}
      />

      {/* Đang đợi thanh toán */}
      <StatCard
        title="Đang đợi thanh toán"
        value={loading ? '...' : (statistics?.counts?.partial || 0)}
        icon={Clock}
        description="Hóa đơn thanh toán một phần"
        accentColor="amber"
        onClick={() => onStatusClick?.('partial')}
      />

      {/* Đã hoàn thành */}
      <StatCard
        title="Đã hoàn thành"
        value={loading ? '...' : (statistics?.counts?.paid || 0)}
        icon={CheckCircle2}
        description="Hóa đơn đã thanh toán đủ"
        accentColor="blue"
        onClick={() => onStatusClick?.('paid')}
      />
    </div>
  );
}

export default InvoiceStats;
