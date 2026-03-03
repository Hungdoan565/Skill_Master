import { useState, useEffect } from 'react';
import { Search, X, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { STATUS_CONFIG } from '../constants';

export default function CertificateFilters({ filters, onFilterChange, certificateTypes }) {
  const [search, setSearch] = useState(filters?.search || '');

  useEffect(() => {
    setSearch(filters?.search || '');
  }, [filters?.search]);

  useEffect(() => {
    const timer = setTimeout(() => {
      const currentSearch = filters?.search || '';
      if (search === currentSearch) return;
      onFilterChange({ ...filters, search: search || undefined });
    }, 300);
    return () => clearTimeout(timer);
  }, [search, onFilterChange, filters]);

  const handleTypeChange = (value) => {
    onFilterChange({ ...filters, certificate_type_id: value === 'all' ? undefined : value });
  };

  const handleStatusChange = (value) => {
    onFilterChange({ ...filters, status: value === 'all' ? undefined : value });
  };

  const handleDateChange = (field, value) => {
    onFilterChange({ ...filters, [field]: value || undefined });
  };

  const handleReset = () => {
    setSearch('');
    onFilterChange({});
  };

  const selectedType = filters?.certificate_type_id || filters?.certificateTypeId;
  const hasFilters = search || selectedType || filters?.status || filters?.dateFrom || filters?.dateTo;
  
  // Count active filters
  const activeFilterCount = [
    !!search, 
    !!selectedType,
    !!filters?.status, 
    !!filters?.dateFrom, 
    !!filters?.dateTo
  ].filter(Boolean).length;

  return (
    <div className="flex flex-col gap-4 animate-in fade-in duration-300">
      <div className="flex items-center justify-between pb-2 border-b border-border/50">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm text-foreground">Bộ lọc và tìm kiếm</h3>
          {activeFilterCount > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/20 text-[10px] font-medium text-primary">
              {activeFilterCount}
            </span>
          )}
        </div>
        {hasFilters && (
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={handleReset}
            className="h-8 px-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10"
          >
            <X className="h-4 w-4 mr-1.5" /> Xóa thiết lập
          </Button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[200px] max-w-[320px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên học viên, mã CCCD..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 bg-white border-border/50 shadow-sm focus-visible:ring-1 focus-visible:border-primary transition-all"
          />
        </div>

        {/* Type Filter */}
        <Select value={selectedType || 'all'} onValueChange={handleTypeChange}>
          <SelectTrigger className="w-[180px] bg-white border-border/50 shadow-sm transition-all focus:ring-1">
            <SelectValue placeholder="Tất cả loại" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            <SelectItem value="all" className="font-medium">Tất cả chứng chỉ</SelectItem>
            {certificateTypes?.map((type) => (
              <SelectItem key={type.id} value={type.id}>{type.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Status Filter */}
        <Select value={filters?.status || 'all'} onValueChange={handleStatusChange}>
          <SelectTrigger className="w-[160px] bg-white border-border/50 shadow-sm transition-all focus:ring-1">
            <SelectValue placeholder="Trạng thái" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all" className="font-medium">Tất cả trạng thái</SelectItem>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => (
              <SelectItem key={key} value={key}>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${key === 'issued' ? 'bg-green-500' : key === 'revoked' ? 'bg-destructive' : key === 'expiring' ? 'bg-amber-500' : 'bg-muted-foreground'}`} />
                  {config.label}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Date Filters Container */}
        <div className="flex items-center bg-white rounded-md border border-border/50 shadow-sm overflow-hidden h-9 px-1 focus-within:ring-1 focus-within:ring-ring focus-within:border-primary transition-all">
          <div className="pl-2 pr-1 text-muted-foreground flex items-center">
            <CalendarIcon className="h-4 w-4" />
          </div>
          <Input
            type="date"
            value={filters?.dateFrom || ''}
            onChange={(e) => handleDateChange('dateFrom', e.target.value)}
            className="w-[130px] h-8 border-0 focus-visible:ring-0 shadow-none px-2 rounded-none bg-transparent"
            title="Từ ngày"
          />
          <div className="text-muted-foreground px-1 text-sm font-medium">→</div>
          <Input
            type="date"
            value={filters?.dateTo || ''}
            onChange={(e) => handleDateChange('dateTo', e.target.value)}
            className="w-[130px] h-8 border-0 focus-visible:ring-0 shadow-none px-2 rounded-none bg-transparent"
            title="Đến ngày"
          />
        </div>
      </div>
    </div>
  );
}
