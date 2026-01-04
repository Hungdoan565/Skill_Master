/**
 * EmptyState Component
 * 
 * Unified empty state component for all Admin pages
 * - Consistent design across app
 * - Multiple variants (default, search, error, no-permission)
 * - Optional action button
 * - Animated illustration
 */

import { cn } from '@/lib/utils';
import {
  Search,
  FileX,
  AlertTriangle,
  Lock,
  Plus,
  RefreshCw,
  Inbox,
  Users,
  BookOpen,
  Receipt,
  Calendar,
  Award,
  FileText,
  Building2,
  UserCog,
} from 'lucide-react';

// Predefined variants
const VARIANTS = {
  default: {
    icon: Inbox,
    title: 'Không có dữ liệu',
    description: 'Chưa có dữ liệu nào được thêm vào hệ thống.',
  },
  search: {
    icon: Search,
    title: 'Không tìm thấy kết quả',
    description: 'Thử thay đổi từ khóa tìm kiếm hoặc bộ lọc.',
  },
  error: {
    icon: AlertTriangle,
    title: 'Đã xảy ra lỗi',
    description: 'Không thể tải dữ liệu. Vui lòng thử lại sau.',
  },
  'no-permission': {
    icon: Lock,
    title: 'Không có quyền truy cập',
    description: 'Bạn không có quyền xem nội dung này.',
  },
  students: {
    icon: Users,
    title: 'Chưa có học viên',
    description: 'Bắt đầu bằng cách thêm học viên mới vào hệ thống.',
  },
  courses: {
    icon: BookOpen,
    title: 'Chưa có khóa học',
    description: 'Tạo khóa học đầu tiên để bắt đầu.',
  },
  invoices: {
    icon: Receipt,
    title: 'Chưa có hóa đơn',
    description: 'Hóa đơn sẽ xuất hiện khi có học viên ghi danh.',
  },
  schedule: {
    icon: Calendar,
    title: 'Chưa có lịch học',
    description: 'Tạo lớp học và thiết lập lịch dạy.',
  },
  certificates: {
    icon: Award,
    title: 'Chưa có chứng chỉ',
    description: 'Chứng chỉ sẽ được tạo khi học viên hoàn thành khóa học.',
  },
  documents: {
    icon: FileText,
    title: 'Chưa có tài liệu',
    description: 'Upload tài liệu đầu tiên để bắt đầu.',
  },
  centers: {
    icon: Building2,
    title: 'Chưa có trung tâm',
    description: 'Thêm trung tâm/cơ sở để bắt đầu quản lý.',
  },
  staff: {
    icon: UserCog,
    title: 'Chưa có nhân sự',
    description: 'Thêm giáo viên và nhân viên vào hệ thống.',
  },
};

// Icon wrapper with animation
function IconWrapper({ icon: Icon, variant }) {
  const isError = variant === 'error';
  const isLocked = variant === 'no-permission';
  
  return (
    <div className="relative">
      {/* Background circles */}
      <div className={cn(
        'absolute inset-0 rounded-full opacity-20 blur-xl animate-pulse',
        isError ? 'bg-red-500' : isLocked ? 'bg-amber-500' : 'bg-zinc-400'
      )} />
      
      {/* Icon container */}
      <div className={cn(
        'relative flex h-24 w-24 items-center justify-center rounded-full',
        isError 
          ? 'bg-red-50 text-red-500' 
          : isLocked 
            ? 'bg-amber-50 text-amber-500'
            : 'bg-zinc-100 text-zinc-400'
      )}>
        <Icon className="h-10 w-10" strokeWidth={1.5} />
      </div>
    </div>
  );
}

export function EmptyState({
  variant = 'default',
  title,
  description,
  icon: CustomIcon,
  action,
  actionLabel,
  onAction,
  secondaryAction,
  secondaryActionLabel,
  onSecondaryAction,
  className,
  compact = false,
}) {
  // Get variant config
  const variantConfig = VARIANTS[variant] || VARIANTS.default;
  
  // Use custom values or fall back to variant defaults
  const finalTitle = title || variantConfig.title;
  const finalDescription = description || variantConfig.description;
  const FinalIcon = CustomIcon || variantConfig.icon;

  // Determine action button icon
  const ActionIcon = variant === 'error' ? RefreshCw : Plus;

  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center',
        compact ? 'py-8 px-4' : 'py-16 px-6',
        className
      )}
    >
      {/* Icon */}
      <IconWrapper icon={FinalIcon} variant={variant} />

      {/* Content */}
      <div className={cn('mt-6', compact && 'mt-4')}>
        <h3 className={cn(
          'font-semibold text-zinc-900',
          compact ? 'text-base' : 'text-lg'
        )}>
          {finalTitle}
        </h3>
        <p className={cn(
          'mt-2 text-zinc-500 max-w-sm',
          compact ? 'text-sm' : 'text-base'
        )}>
          {finalDescription}
        </p>
      </div>

      {/* Actions */}
      {(action || actionLabel || secondaryAction || secondaryActionLabel) && (
        <div className={cn(
          'flex items-center gap-3',
          compact ? 'mt-4' : 'mt-6'
        )}>
          {/* Secondary action */}
          {(secondaryAction || secondaryActionLabel) && (
            <button
              onClick={onSecondaryAction}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
                'text-sm font-medium text-zinc-600',
                'border border-zinc-200 bg-white',
                'hover:bg-zinc-50 hover:border-zinc-300',
                'transition-colors duration-200'
              )}
            >
              {secondaryActionLabel || secondaryAction}
            </button>
          )}

          {/* Primary action */}
          {(action || actionLabel) && (
            <button
              onClick={onAction}
              className={cn(
                'inline-flex items-center gap-2 px-4 py-2 rounded-xl',
                'text-sm font-medium text-white',
                variant === 'error'
                  ? 'bg-zinc-900 hover:bg-zinc-800'
                  : 'bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600',
                'shadow-lg shadow-red-600/20',
                'transition-all duration-200'
              )}
            >
              <ActionIcon className="h-4 w-4" />
              {actionLabel || action}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// Table empty state variant
export function TableEmptyState({
  colSpan = 1,
  variant = 'default',
  ...props
}) {
  return (
    <tr>
      <td colSpan={colSpan} className="p-0">
        <EmptyState variant={variant} compact {...props} />
      </td>
    </tr>
  );
}

// Card empty state variant
export function CardEmptyState(props) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white">
      <EmptyState {...props} />
    </div>
  );
}

export default EmptyState;
