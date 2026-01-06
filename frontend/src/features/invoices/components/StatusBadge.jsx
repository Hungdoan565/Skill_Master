/**
 * StatusBadge Component - REDESIGNED
 * 
 * Compact dot + text badge for invoice status.
 * Replaces pill badges for cleaner high-density tables.
 * 
 * @param {string} status - Invoice status: unpaid | partial | paid | cancelled | refunded
 * @param {boolean} compact - If true, shows only dot (no text)
 */

import { cn } from '@/lib/utils';

const STATUS_CONFIG = {
  unpaid: {
    label: 'Chưa thanh toán',
    shortLabel: 'Chưa TT',
    dotColor: 'bg-red-500',
    textColor: 'text-red-600 dark:text-red-400',
  },
  partial: {
    label: 'Thanh toán một phần',
    shortLabel: 'TT 1 phần',
    dotColor: 'bg-amber-500',
    textColor: 'text-amber-600 dark:text-amber-400',
  },
  paid: {
    label: 'Đã thanh toán',
    shortLabel: 'Đã TT',
    dotColor: 'bg-emerald-500',
    textColor: 'text-emerald-600 dark:text-emerald-400',
  },
  cancelled: {
    label: 'Đã hủy',
    shortLabel: 'Đã hủy',
    dotColor: 'bg-zinc-400',
    textColor: 'text-muted-foreground',
  },
  refunded: {
    label: 'Hoàn tiền',
    shortLabel: 'Hoàn tiền',
    dotColor: 'bg-purple-500',
    textColor: 'text-purple-600 dark:text-purple-400',
  },
};

export function StatusBadge({ status, compact = false }) {
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.unpaid;

  if (compact) {
    return (
      <span
        className={cn('w-2 h-2 rounded-full inline-block', config.dotColor)}
        title={config.label}
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-1.5">
      <span className={cn('w-1.5 h-1.5 rounded-full flex-shrink-0', config.dotColor)} />
      <span className={cn('text-xs font-medium whitespace-nowrap', config.textColor)}>
        {config.shortLabel}
      </span>
    </span>
  );
}

export default StatusBadge;
