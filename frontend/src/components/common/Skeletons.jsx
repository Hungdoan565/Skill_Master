/**
 * Skeleton Components Library
 * 
 * Reusable skeleton loading components cho admin features
 * Consistent với design system
 */

import { cn } from '@/lib/utils';

// ============================================
// BASE SKELETON
// ============================================

export function Skeleton({ className, ...props }) {
  return (
    <div
      className={cn(
        'animate-pulse rounded-md bg-slate-200',
        className
      )}
      {...props}
    />
  );
}

// ============================================
// TEXT SKELETONS
// ============================================

export function TextSkeleton({ lines = 1, className }) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          className={cn(
            'h-4',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        />
      ))}
    </div>
  );
}

export function HeadingSkeleton({ className }) {
  return <Skeleton className={cn('h-7 w-48', className)} />;
}

export function ParagraphSkeleton({ className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-full" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// ============================================
// AVATAR & IMAGE SKELETONS
// ============================================

export function AvatarSkeleton({ size = 'md', className }) {
  const sizeClasses = {
    sm: 'h-8 w-8',
    md: 'h-10 w-10',
    lg: 'h-12 w-12',
    xl: 'h-16 w-16',
  };

  return (
    <Skeleton 
      className={cn(
        'rounded-full',
        sizeClasses[size],
        className
      )} 
    />
  );
}

export function ImageSkeleton({ aspectRatio = '16/9', className }) {
  return (
    <Skeleton 
      className={cn('w-full', className)}
      style={{ aspectRatio }}
    />
  );
}

// ============================================
// CARD SKELETONS
// ============================================

export function CardSkeleton({ className }) {
  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white p-6',
      className
    )}>
      <div className="space-y-4">
        <Skeleton className="h-5 w-1/3" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    </div>
  );
}

export function StatCardSkeleton({ className }) {
  return (
    <div className={cn(
      'rounded-xl border border-slate-200 bg-white p-6',
      className
    )}>
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-16" />
        </div>
        <Skeleton className="h-12 w-12 rounded-xl" />
      </div>
      <Skeleton className="h-3 w-32 mt-4" />
    </div>
  );
}

// ============================================
// TABLE SKELETON
// ============================================

export function TableSkeleton({ 
  rows = 5, 
  columns = 5, 
  showHeader = true,
  className 
}) {
  return (
    <div className={cn('overflow-hidden rounded-lg border border-slate-200', className)}>
      {/* Header */}
      {showHeader && (
        <div className="flex gap-4 border-b border-slate-200 bg-slate-50 px-4 py-3">
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton 
              key={i} 
              className="h-4 flex-1" 
              style={{ maxWidth: i === 0 ? '200px' : '150px' }}
            />
          ))}
        </div>
      )}

      {/* Rows */}
      <div className="bg-white">
        {Array.from({ length: rows }).map((_, rowIndex) => (
          <div
            key={rowIndex}
            className={cn(
              'flex items-center gap-4 px-4 py-4',
              rowIndex !== rows - 1 && 'border-b border-slate-100'
            )}
          >
            {/* Avatar cell */}
            <div className="flex items-center gap-3" style={{ width: '200px' }}>
              <AvatarSkeleton size="md" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            
            {/* Other cells */}
            {Array.from({ length: columns - 1 }).map((_, colIndex) => (
              <Skeleton
                key={colIndex}
                className="h-4 flex-1"
                style={{ maxWidth: colIndex === columns - 2 ? '100px' : '150px' }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================
// FORM SKELETON
// ============================================

export function FormFieldSkeleton({ className }) {
  return (
    <div className={cn('space-y-2', className)}>
      <Skeleton className="h-4 w-24" />
      <Skeleton className="h-11 w-full" />
    </div>
  );
}

export function FormSkeleton({ fields = 4, className }) {
  return (
    <div className={cn('space-y-4', className)}>
      {Array.from({ length: fields }).map((_, i) => (
        <FormFieldSkeleton key={i} />
      ))}
      <div className="flex justify-end gap-2 pt-4">
        <Skeleton className="h-10 w-20" />
        <Skeleton className="h-10 w-28" />
      </div>
    </div>
  );
}

// ============================================
// LIST SKELETON
// ============================================

export function ListItemSkeleton({ className }) {
  return (
    <div className={cn('flex items-center gap-3 py-3', className)}>
      <AvatarSkeleton size="md" />
      <div className="flex-1 space-y-1.5">
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-3 w-1/2" />
      </div>
      <Skeleton className="h-6 w-16 rounded-full" />
    </div>
  );
}

export function ListSkeleton({ items = 5, className }) {
  return (
    <div className={cn('divide-y divide-slate-100', className)}>
      {Array.from({ length: items }).map((_, i) => (
        <ListItemSkeleton key={i} />
      ))}
    </div>
  );
}

// ============================================
// CHART SKELETON
// ============================================

export function ChartSkeleton({ height = 300, className }) {
  return (
    <div className={cn('rounded-xl border border-slate-200 bg-white p-6', className)}>
      <div className="flex items-center justify-between mb-6">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-8 w-24" />
      </div>
      <div 
        className="flex items-end gap-2"
        style={{ height }}
      >
        {Array.from({ length: 12 }).map((_, i) => (
          <Skeleton
            key={i}
            className="flex-1 rounded-t"
            style={{ height: `${Math.random() * 60 + 30}%` }}
          />
        ))}
      </div>
      <div className="flex justify-between mt-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-3 w-8" />
        ))}
      </div>
    </div>
  );
}

// ============================================
// PAGE SKELETON
// ============================================

export function PageHeaderSkeleton({ className }) {
  return (
    <div className={cn('flex items-center justify-between mb-6', className)}>
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-28" />
        <Skeleton className="h-10 w-32" />
      </div>
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeaderSkeleton />

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <StatCardSkeleton key={i} />
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartSkeleton height={250} />
        <ChartSkeleton height={250} />
      </div>

      {/* Tables/Lists */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <CardSkeleton className="p-0">
            <TableSkeleton rows={5} columns={4} />
          </CardSkeleton>
        </div>
        <CardSkeleton>
          <ListSkeleton items={5} />
        </CardSkeleton>
      </div>
    </div>
  );
}

export function TablePageSkeleton() {
  return (
    <div className="space-y-6">
      <PageHeaderSkeleton />
      
      {/* Filters */}
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <div className="flex items-center gap-4">
          <Skeleton className="h-11 flex-1 max-w-sm" />
          <Skeleton className="h-11 w-32" />
          <Skeleton className="h-11 w-32" />
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border border-slate-200 bg-white">
        <TableSkeleton rows={10} columns={5} />
      </div>
    </div>
  );
}

export default Skeleton;
