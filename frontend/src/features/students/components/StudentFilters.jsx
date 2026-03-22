/**
 * StudentFilters Component
 * Thanh tìm kiếm và filter học viên
 */

import { Search, Filter, LayoutList, Rows3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { SimpleSelect } from './SimpleSelect';
import { ENROLLMENT_STATE_OPTIONS, STATUS_OPTIONS, VIEW_MODE_OPTIONS } from '../utils';

export function StudentFilters({ 
  searchTerm, 
  onSearchChange, 
  statusFilter, 
  onStatusChange,
  viewMode,
  onViewModeChange,
  centerFilter,
  onCenterChange,
  centerOptions = [],
  courseFilter,
  onCourseChange,
  courseOptions = [],
  classFilter,
  onClassChange,
  classOptions = [],
  enrollmentState,
  onEnrollmentStateChange,
  filteredCount,
  totalCount
}) {
  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div className="relative w-full xl:max-w-md">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Tìm theo tên, email hoặc SĐT..."
            className="pl-10 bg-white dark:bg-gray-800 dark:border-gray-700"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>

        <div className="inline-flex w-full xl:w-auto rounded-xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm">
          {VIEW_MODE_OPTIONS.map((option) => {
            const isActive = option.value === viewMode;
            const Icon = option.value === 'list' ? LayoutList : Rows3;

            return (
              <button
                key={option.value}
                type="button"
                onClick={() => onViewModeChange(option.value)}
                className={`inline-flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors xl:flex-none ${
                  isActive
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'text-slate-600 dark:text-gray-400 hover:bg-slate-50 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="h-4 w-4" />
                {option.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="rounded-2xl border border-slate-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-end xl:justify-between">
          <div className="grid flex-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Trạng thái</p>
              <SimpleSelect
                value={statusFilter}
                onChange={onStatusChange}
                placeholder="Tất cả trạng thái"
                options={STATUS_OPTIONS}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Ghi danh</p>
              <SimpleSelect
                value={enrollmentState}
                onChange={onEnrollmentStateChange}
                placeholder="Tất cả ghi danh"
                options={ENROLLMENT_STATE_OPTIONS}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Trung tâm</p>
              <SimpleSelect
                value={centerFilter}
                onChange={onCenterChange}
                placeholder="Tất cả trung tâm"
                options={centerOptions}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Khóa học</p>
              <SimpleSelect
                value={courseFilter}
                onChange={onCourseChange}
                placeholder="Tất cả khóa học"
                options={courseOptions}
              />
            </div>

            <div className="space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-gray-400">Lớp học</p>
              <SimpleSelect
                value={classFilter}
                onChange={onClassChange}
                placeholder="Tất cả lớp học"
                options={classOptions}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 rounded-xl bg-slate-50 dark:bg-gray-700/50 px-3 py-2 text-sm text-slate-600 dark:text-gray-400">
            <Filter className="h-4 w-4 text-slate-400 dark:text-gray-500" />
            Hiển thị <strong className="text-slate-900 dark:text-gray-100">{filteredCount}</strong> / {totalCount}
          </div>
        </div>
      </div>
    </div>
  );
}

export default StudentFilters;
