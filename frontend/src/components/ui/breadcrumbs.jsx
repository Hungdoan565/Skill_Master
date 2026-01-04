/**
 * Breadcrumbs Component
 * 
 * Hiển thị navigation trail cho Admin pages
 * - Auto-generate từ URL path
 * - Custom labels cho từng route
 * - Hover & Active states
 * - Responsive design
 */

import { useLocation, Link } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';
import { cn } from '@/lib/utils';

// Route labels mapping
const ROUTE_LABELS = {
  admin: 'Quản trị',
  dashboard: 'Tổng quan',
  courses: 'Khóa học',
  classes: 'Lớp học',
  schedule: 'Lịch dạy',
  rooms: 'Phòng học',
  students: 'Học viên',
  enrollments: 'Ghi danh',
  invoices: 'Hóa đơn',
  certificates: 'Chứng chỉ',
  staff: 'Nhân sự',
  payroll: 'Bảng lương',
  notifications: 'Thông báo',
  centers: 'Trung tâm',
  documents: 'Tài liệu',
  reports: 'Báo cáo',
  support: 'Hỗ trợ',
  settings: 'Cài đặt',
  profile: 'Hồ sơ cá nhân',
  new: 'Thêm mới',
  edit: 'Chỉnh sửa',
  grades: 'Điểm số',
};

// Routes that should not be clickable
const NON_CLICKABLE_SEGMENTS = ['new', 'edit'];

export function Breadcrumbs({ className, customLabels = {} }) {
  const location = useLocation();
  const pathSegments = location.pathname.split('/').filter(Boolean);

  // Combine default and custom labels
  const labels = { ...ROUTE_LABELS, ...customLabels };

  // Generate breadcrumb items
  const breadcrumbs = pathSegments.map((segment, index) => {
    const path = '/' + pathSegments.slice(0, index + 1).join('/');
    const isLast = index === pathSegments.length - 1;
    const isId = /^[0-9a-fA-F-]{36}$/.test(segment) || /^\d+$/.test(segment);
    const isNonClickable = NON_CLICKABLE_SEGMENTS.includes(segment);

    // Get label
    let label = labels[segment] || segment;
    
    // Handle UUIDs and numeric IDs - show "Chi tiết" instead
    if (isId) {
      label = 'Chi tiết';
    }

    return {
      label,
      path,
      isLast,
      isClickable: !isLast && !isId && !isNonClickable,
    };
  });

  // Don't show breadcrumbs on dashboard
  if (pathSegments.length <= 2 && pathSegments.includes('dashboard')) {
    return null;
  }

  return (
    <nav 
      aria-label="Breadcrumb"
      className={cn('flex items-center gap-1 text-sm', className)}
    >
      {/* Home icon */}
      <Link
        to="/admin/dashboard"
        className="flex items-center justify-center h-7 w-7 rounded-lg text-zinc-400 
                   hover:text-zinc-600 hover:bg-zinc-100 transition-colors"
        aria-label="Về Dashboard"
      >
        <Home className="h-4 w-4" />
      </Link>

      {breadcrumbs.map((crumb, index) => (
        <div key={crumb.path} className="flex items-center gap-1">
          {/* Separator */}
          <ChevronRight className="h-4 w-4 text-zinc-300 flex-shrink-0" />

          {/* Breadcrumb item */}
          {crumb.isClickable ? (
            <Link
              to={crumb.path}
              className={cn(
                'px-2 py-1 rounded-lg font-medium transition-colors',
                'text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100'
              )}
            >
              {crumb.label}
            </Link>
          ) : (
            <span
              className={cn(
                'px-2 py-1 rounded-lg font-medium',
                crumb.isLast 
                  ? 'text-zinc-900 bg-zinc-100' 
                  : 'text-zinc-400'
              )}
            >
              {crumb.label}
            </span>
          )}
        </div>
      ))}
    </nav>
  );
}

// Variant with page title
export function BreadcrumbsWithTitle({ 
  title, 
  description, 
  actions, 
  className,
  customLabels 
}) {
  return (
    <div className={cn('mb-6 space-y-3', className)}>
      {/* Breadcrumbs */}
      <Breadcrumbs customLabels={customLabels} />

      {/* Title row */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">
            {title}
          </h1>
          {description && (
            <p className="mt-1 text-sm text-zinc-500">
              {description}
            </p>
          )}
        </div>
        
        {/* Action buttons */}
        {actions && (
          <div className="flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}
      </div>
    </div>
  );
}

export default Breadcrumbs;
