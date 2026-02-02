/**
 * InvoiceFilters Component
 *
 * Pure Component cho thanh lọc hóa đơn với IconSelect đồng bộ style admin.
 * Bao gồm: Search, Status filter, Overdue filter, Date range, Center filter (Super Admin), Invoice Type filter
 *
 * @param {Object} filters - { search, status, dateStart, dateEnd, overdueOnly, centerId, invoiceType }
 * @param {function} onFilterChange - Handler thay đổi filter
 * @param {function} onReset - Handler reset filters
 * @param {boolean} hasActiveFilters - Có filter đang active không
 * @param {boolean} isSuperAdmin - User có phải Super Admin không
 * @param {Array} centers - Danh sách centers (cho Super Admin)
 */

import { useState, useRef, useEffect } from 'react';
import { 
  Search, 
  Calendar, 
  X, 
  AlertTriangle, 
  Building2, 
  ChevronDown,
  Filter,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  GraduationCap,
  BookOpen,
  Shirt,
  FileText,
  MoreHorizontal
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// IconSelect Component
function IconSelect({ value, onChange, options, placeholder, icon: Icon }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);
  
  const selectedOption = options.find(opt => opt.value === value);
  
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  
  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-muted/50 hover:bg-muted transition-colors text-sm min-w-[160px] justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon ? (
            <selectedOption.icon className={`h-4 w-4 ${selectedOption.iconColor}`} />
          ) : Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" />
          ) : null}
          <span className="text-foreground">{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      
      {isOpen && (
        <div className="absolute top-full left-0 mt-1 w-full bg-white rounded-lg border shadow-lg z-50 py-1">
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-sm hover:bg-slate-50 flex items-center gap-2 transition-colors ${
                value === option.value ? 'bg-slate-50 font-medium' : ''
              }`}
            >
              {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-muted-foreground'}`} />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Status options with Lucide icons
const STATUS_OPTIONS = [
  { value: 'all', label: 'Tất cả trạng thái', icon: Filter, iconColor: 'text-muted-foreground' },
  { value: 'unpaid', label: 'Chưa thanh toán', icon: Clock, iconColor: 'text-orange-500' },
  { value: 'partial', label: 'Thanh toán một phần', icon: AlertCircle, iconColor: 'text-yellow-500' },
  { value: 'paid', label: 'Đã thanh toán', icon: CheckCircle, iconColor: 'text-green-500' },
  { value: 'cancelled', label: 'Đã hủy', icon: XCircle, iconColor: 'text-red-500' },
];

// Invoice type options with Lucide icons
const INVOICE_TYPE_OPTIONS = [
  { value: 'all', label: 'Tất cả loại', icon: Filter, iconColor: 'text-muted-foreground' },
  { value: 'tuition', label: 'Học phí', icon: GraduationCap, iconColor: 'text-blue-500' },
  { value: 'book', label: 'Giáo trình/Sách', icon: BookOpen, iconColor: 'text-indigo-500' },
  { value: 'uniform', label: 'Đồng phục', icon: Shirt, iconColor: 'text-purple-500' },
  { value: 'exam', label: 'Phí thi', icon: FileText, iconColor: 'text-orange-500' },
  { value: 'other', label: 'Phí khác', icon: MoreHorizontal, iconColor: 'text-slate-500' }
];

export function InvoiceFilters({
  filters,
  onFilterChange,
  onReset,
  hasActiveFilters,
  isSuperAdmin = false,
  centers = []
}) {
  // Prepare center options
  const centerOptions = [
    { value: '', label: 'Tất cả trung tâm', icon: Building2, iconColor: 'text-muted-foreground' },
    ...centers.map(center => ({
      value: center.id,
      label: center.name,
      icon: Building2,
      iconColor: 'text-blue-500'
    }))
  ];

  return (
    <div className="px-4 py-3 border-b border-border">
      <div className="flex flex-wrap items-center gap-3">

        {/* Search Input */}
        <div className="flex-1 min-w-[200px] max-w-md">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Tìm mã hóa đơn, tên học viên..."
              value={filters.search}
              onChange={(e) => onFilterChange('search', e.target.value)}
              className="
                w-full h-9 pl-9 pr-3 rounded-lg
                bg-muted/50 border border-border text-sm text-foreground
                focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
                placeholder:text-muted-foreground
              "
            />
          </div>
        </div>

        {/* Center Filter - Only for Super Admin */}
        {isSuperAdmin && centers.length > 0 && (
          <IconSelect
            value={filters.centerId || ''}
            onChange={(value) => onFilterChange('centerId', value)}
            options={centerOptions}
            placeholder="Chọn trung tâm"
            icon={Building2}
          />
        )}

        {/* Status Filter */}
        <IconSelect
          value={filters.status}
          onChange={(value) => onFilterChange('status', value)}
          options={STATUS_OPTIONS}
          placeholder="Trạng thái"
          icon={Filter}
        />

        {/* Invoice Type Filter */}
        <IconSelect
          value={filters.invoiceType || 'all'}
          onChange={(value) => onFilterChange('invoiceType', value)}
          options={INVOICE_TYPE_OPTIONS}
          placeholder="Loại hóa đơn"
          icon={Filter}
        />

        {/* Overdue Filter */}
        <button
          onClick={() => onFilterChange('overdueOnly', !filters.overdueOnly)}
          className={`
            h-9 px-3 rounded-lg border text-sm font-medium
            flex items-center gap-1.5 transition-colors
            ${filters.overdueOnly
              ? 'bg-red-100 dark:bg-red-900/30 border-red-300 dark:border-red-800 text-red-700 dark:text-red-300'
              : 'bg-muted/50 border-border text-muted-foreground hover:bg-muted'
            }
          `}
        >
          <AlertTriangle className="w-3.5 h-3.5" />
          Quá hạn
        </button>

        {/* Date Range */}
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-muted-foreground" />
          <input
            type="date"
            value={filters.dateStart}
            onChange={(e) => onFilterChange('dateStart', e.target.value)}
            className="
              h-9 px-2 rounded-lg text-sm
              bg-muted/50 border border-border text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            "
          />
          <span className="text-muted-foreground text-xs">—</span>
          <input
            type="date"
            value={filters.dateEnd}
            onChange={(e) => onFilterChange('dateEnd', e.target.value)}
            className="
              h-9 px-2 rounded-lg text-sm
              bg-muted/50 border border-border text-foreground
              focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent
            "
          />
        </div>

        {/* Clear Filters */}
        {hasActiveFilters && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="h-9 text-muted-foreground hover:text-foreground"
          >
            <X className="w-3.5 h-3.5 mr-1" />
            Xóa lọc
          </Button>
        )}
      </div>
    </div>
  );
}

export default InvoiceFilters;
