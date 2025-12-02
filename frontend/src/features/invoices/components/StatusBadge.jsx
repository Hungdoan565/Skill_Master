/**
 * StatusBadge Component
 * 
 * Pure UI component hiển thị trạng thái hóa đơn dưới dạng badge.
 * Không có logic, chỉ nhận props và render.
 * 
 * @param {string} status - Trạng thái hóa đơn: unpaid | partial | paid | cancelled | refunded
 */

const STATUS_CONFIG = {
  unpaid: { 
    label: 'Chưa thanh toán', 
    className: 'bg-red-100 text-red-700 border-red-200' 
  },
  partial: { 
    label: 'Thanh toán một phần', 
    className: 'bg-amber-100 text-amber-700 border-amber-200' 
  },
  paid: { 
    label: 'Đã thanh toán', 
    className: 'bg-emerald-100 text-emerald-700 border-emerald-200' 
  },
  cancelled: { 
    label: 'Đã hủy', 
    className: 'bg-zinc-100 text-zinc-600 border-zinc-200' 
  },
  refunded: { 
    label: 'Hoàn tiền', 
    className: 'bg-purple-100 text-purple-700 border-purple-200' 
  },
};

export function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;

  return (
    <span 
      className={`
        inline-flex items-center px-2.5 py-1 
        rounded-full text-xs font-medium border 
        ${config.className}
      `}
    >
      {config.label}
    </span>
  );
}

export default StatusBadge;
