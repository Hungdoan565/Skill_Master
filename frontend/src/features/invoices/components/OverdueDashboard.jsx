/**
 * OverdueDashboard Component
 *
 * Dashboard hiển thị hóa đơn quá hạn và quản lý danh sách gọi điện.
 *
 * Features:
 * - Summary stats cards (total overdue, amount, avg days)
 * - Overdue invoices table with student contact info
 * - Call list management with priority badges
 * - Color coding by severity
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { API_URL } from '../utils/constants';
import { formatMoney, formatDate } from '../utils/formatters';
import {
  Phone, Mail, AlertTriangle, Clock, Users, DollarSign, Calendar,
  ChevronRight, ChevronLeft, Loader2, RefreshCw, Plus, FileText,
  MessageSquare, CheckCircle, ArrowUpCircle, CreditCard, Filter,
  PhoneCall, Edit3, X, ChevronDown, FilterIcon
} from 'lucide-react';

// IconSelect Component for consistent UI
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
        className="flex items-center gap-2 h-9 px-3 rounded-lg border border-border bg-white hover:bg-slate-50 transition-colors text-sm min-w-[140px] justify-between"
      >
        <div className="flex items-center gap-2">
          {selectedOption?.icon ? (
            <selectedOption.icon className={`h-4 w-4 ${selectedOption.iconColor}`} />
          ) : Icon ? (
            <Icon className="h-4 w-4 text-muted-foreground" />
          ) : null}
          <span>{selectedOption?.label || placeholder}</span>
        </div>
        <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
              {option.icon && <option.icon className={`h-4 w-4 ${option.iconColor || 'text-slate-500'}`} />}
              <span>{option.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// Overdue days filter options with icons
const OVERDUE_FILTER_OPTIONS = [
  { value: '-', label: 'Tất cả', icon: FilterIcon, iconColor: 'text-slate-500' },
  { value: '1-7', label: '1-7 ngày', icon: Clock, iconColor: 'text-amber-500' },
  { value: '8-14', label: '8-14 ngày', icon: AlertTriangle, iconColor: 'text-orange-500' },
  { value: '15-30', label: '15-30 ngày', icon: AlertTriangle, iconColor: 'text-red-500' },
  { value: '31-', label: '30+ ngày', icon: AlertTriangle, iconColor: 'text-red-600' },
];

// Severity color mapping based on days overdue
const SEVERITY_CONFIG = {
  low: { range: '1-7 ngày', color: 'bg-amber-100 text-amber-700 border-amber-200', bgRow: 'bg-amber-50/50' },
  medium: { range: '8-14 ngày', color: 'bg-orange-100 text-orange-700 border-orange-200', bgRow: 'bg-orange-50/50' },
  high: { range: '15-30 ngày', color: 'bg-red-100 text-red-700 border-red-200', bgRow: 'bg-red-50/50' },
  critical: { range: '30+ ngày', color: 'bg-red-200 text-red-800 border-red-300', bgRow: 'bg-red-100/50' }
};

const PRIORITY_CONFIG = {
  low: { label: 'Thấp', color: 'bg-slate-100 text-slate-600' },
  normal: { label: 'Bình thường', color: 'bg-blue-100 text-blue-600' },
  high: { label: 'Cao', color: 'bg-orange-100 text-orange-600' },
  urgent: { label: 'Khẩn cấp', color: 'bg-red-100 text-red-600' }
};

const CALL_STATUS_CONFIG = {
  pending: { label: 'Chờ gọi', color: 'bg-slate-100 text-slate-600' },
  called: { label: 'Đã gọi', color: 'bg-blue-100 text-blue-600' },
  promised: { label: 'Hẹn thanh toán', color: 'bg-amber-100 text-amber-600' },
  paid: { label: 'Đã thanh toán', color: 'bg-emerald-100 text-emerald-600' },
  escalated: { label: 'Đã chuyển cấp', color: 'bg-purple-100 text-purple-600' }
};

export function OverdueDashboard() {
  const { session } = useAuth();

  // State
  const [activeTab, setActiveTab] = useState('overdue');
  const [loading, setLoading] = useState(true);
  const [overdueInvoices, setOverdueInvoices] = useState([]);
  const [callList, setCallList] = useState([]);
  const [stats, setStats] = useState({
    totalOverdue: 0,
    totalAmount: 0,
    avgDaysOverdue: 0,
    bySeverity: { low: 0, medium: 0, high: 0, critical: 0 }
  });
  const [pagination, setPagination] = useState({ page: 1, limit: 10, total: 0, totalPages: 0 });
  const [filters, setFilters] = useState({ daysOverdueMin: '', daysOverdueMax: '', sortBy: 'days_overdue', sortOrder: 'desc' });
  const [editingNote, setEditingNote] = useState(null);
  const [noteText, setNoteText] = useState('');

  // Fetch overdue invoices
  const fetchOverdueInvoices = useCallback(async () => {
    if (!session?.access_token) return;

    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: pagination.page.toString(),
        limit: pagination.limit.toString(),
        sortBy: filters.sortBy,
        sortOrder: filters.sortOrder
      });

      if (filters.daysOverdueMin) params.append('daysOverdueMin', filters.daysOverdueMin);
      if (filters.daysOverdueMax) params.append('daysOverdueMax', filters.daysOverdueMax);

      const response = await fetch(`${API_URL}/api/admin/invoices/overdue?${params}`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch overdue invoices');

      const data = await response.json();
      setOverdueInvoices(data.invoices || []);
      setStats(data.stats || stats);
      setPagination(prev => ({
        ...prev,
        total: data.pagination?.total || 0,
        totalPages: data.pagination?.totalPages || 0
      }));
    } catch (error) {
      console.error('Error fetching overdue invoices:', error);
    } finally {
      setLoading(false);
    }
  }, [session?.access_token, pagination.page, pagination.limit, filters]);

  // Fetch call list
  const fetchCallList = useCallback(async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/call-list`, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });

      if (!response.ok) throw new Error('Failed to fetch call list');

      const data = await response.json();
      setCallList(data.items || []);
    } catch (error) {
      console.error('Error fetching call list:', error);
    }
  }, [session?.access_token]);

  useEffect(() => {
    fetchOverdueInvoices();
    fetchCallList();
  }, [fetchOverdueInvoices, fetchCallList]);

  // Add to call list
  const handleAddToCallList = async (invoice, priority = 'normal') => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/call-list`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          invoice_id: invoice.id,
          student_id: invoice.student_id,
          priority,
          notes: ''
        })
      });

      if (!response.ok) throw new Error('Failed to add to call list');

      fetchCallList();
    } catch (error) {
      console.error('Error adding to call list:', error);
    }
  };

  // Update call list item
  const handleUpdateCallItem = async (itemId, updates) => {
    if (!session?.access_token) return;

    try {
      const response = await fetch(`${API_URL}/api/admin/call-list/${itemId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify(updates)
      });

      if (!response.ok) throw new Error('Failed to update call list item');

      fetchCallList();
      setEditingNote(null);
    } catch (error) {
      console.error('Error updating call list item:', error);
    }
  };

  // Get severity level based on days overdue
  const getSeverity = (daysOverdue) => {
    if (daysOverdue <= 7) return 'low';
    if (daysOverdue <= 14) return 'medium';
    if (daysOverdue <= 30) return 'high';
    return 'critical';
  };

  // Handle page change
  const handlePageChange = (newPage) => {
    setPagination(prev => ({ ...prev, page: newPage }));
  };

  // Handle sort change
  const handleSortChange = (sortBy) => {
    setFilters(prev => ({
      ...prev,
      sortBy,
      sortOrder: prev.sortBy === sortBy && prev.sortOrder === 'desc' ? 'asc' : 'desc'
    }));
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Hóa đơn quá hạn</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Quản lý và theo dõi các hóa đơn quá hạn thanh toán
          </p>
        </div>
        <Button onClick={() => { fetchOverdueInvoices(); fetchCallList(); }} variant="outline" size="sm">
          <RefreshCw className="w-4 h-4 mr-2" />
          Làm mới
        </Button>
      </div>

      {/* Summary Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Tổng hóa đơn quá hạn"
          value={stats.totalOverdue}
          icon={FileText}
          color="red"
        />
        <StatCard
          title="Tổng số tiền"
          value={formatMoney(stats.totalAmount)}
          icon={DollarSign}
          color="orange"
        />
        <StatCard
          title="Trung bình ngày quá hạn"
          value={`${Math.round(stats.avgDaysOverdue)} ngày`}
          icon={Clock}
          color="amber"
        />
        <StatCard
          title="Trong danh sách gọi"
          value={callList.length}
          icon={PhoneCall}
          color="blue"
        />
      </div>

      {/* Severity Breakdown */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {Object.entries(SEVERITY_CONFIG).map(([key, config]) => (
          <div
            key={key}
            className={`px-4 py-3 rounded-lg border ${config.color} flex items-center justify-between`}
          >
            <span className="text-sm font-medium">{config.range}</span>
            <span className="text-lg font-bold">{stats.bySeverity?.[key] || 0}</span>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full max-w-md grid-cols-2">
          <TabsTrigger value="overdue" className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4" />
            Hóa đơn quá hạn
          </TabsTrigger>
          <TabsTrigger value="calllist" className="flex items-center gap-2">
            <Phone className="w-4 h-4" />
            Danh sách gọi ({callList.length})
          </TabsTrigger>
        </TabsList>

        {/* Overdue Invoices Tab */}
        <TabsContent value="overdue" className="mt-4">
          <OverdueTable
            invoices={overdueInvoices}
            loading={loading}
            pagination={pagination}
            filters={filters}
            onPageChange={handlePageChange}
            onSortChange={handleSortChange}
            onFilterChange={setFilters}
            onAddToCallList={handleAddToCallList}
            getSeverity={getSeverity}
          />
        </TabsContent>

        {/* Call List Tab */}
        <TabsContent value="calllist" className="mt-4">
          <CallListTable
            items={callList}
            onUpdateItem={handleUpdateCallItem}
            editingNote={editingNote}
            setEditingNote={setEditingNote}
            noteText={noteText}
            setNoteText={setNoteText}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}


// ============================================
// STAT CARD COMPONENT
// ============================================
function StatCard({ title, value, icon: Icon, color = 'blue' }) {
  const colorClasses = {
    red: 'bg-red-50 text-red-600 border-red-100',
    orange: 'bg-orange-50 text-orange-600 border-orange-100',
    amber: 'bg-amber-50 text-amber-600 border-amber-100',
    blue: 'bg-blue-50 text-blue-600 border-blue-100',
    emerald: 'bg-emerald-50 text-emerald-600 border-emerald-100'
  };

  const iconBg = {
    red: 'bg-red-500',
    orange: 'bg-orange-500',
    amber: 'bg-amber-500',
    blue: 'bg-blue-500',
    emerald: 'bg-emerald-500'
  };

  return (
    <div className={`rounded-xl border p-4 ${colorClasses[color]}`}>
      <div className="flex items-center gap-3">
        <div className={`p-2.5 rounded-lg ${iconBg[color]}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-xl font-bold mt-0.5">{value}</p>
        </div>
      </div>
    </div>
  );
}

// ============================================
// OVERDUE TABLE COMPONENT
// ============================================
function OverdueTable({
  invoices,
  loading,
  pagination,
  filters,
  onPageChange,
  onSortChange,
  onFilterChange,
  onAddToCallList,
  getSeverity
}) {
  if (loading) {
    return (
      <div className="flex items-center justify-center h-48 bg-card rounded-lg border">
        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!invoices || invoices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-card rounded-lg border">
        <CheckCircle className="w-10 h-10 mb-2 text-emerald-500" />
        <p className="text-sm font-medium text-foreground">Không có hóa đơn quá hạn</p>
        <p className="text-xs text-muted-foreground mt-1">Tất cả hóa đơn đã được thanh toán đúng hạn</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      {/* Filters */}
      <div className="px-4 py-3 border-b bg-muted/30 flex items-center gap-4 flex-wrap">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm font-medium">Lọc theo ngày quá hạn:</span>
        </div>
        <IconSelect
          value={`${filters.daysOverdueMin || ''}-${filters.daysOverdueMax || ''}`}
          onChange={(value) => {
            const [min, max] = value.split('-');
            onFilterChange(prev => ({ ...prev, daysOverdueMin: min, daysOverdueMax: max }));
          }}
          options={OVERDUE_FILTER_OPTIONS}
          placeholder="Chọn khoảng thời gian"
          icon={Filter}
        />
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Học viên
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Liên hệ
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Mã hóa đơn
              </th>
              <th
                className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => onSortChange('amount')}
              >
                Số tiền {filters.sortBy === 'amount' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Hạn thanh toán
              </th>
              <th
                className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground"
                onClick={() => onSortChange('days_overdue')}
              >
                Quá hạn {filters.sortBy === 'days_overdue' && (filters.sortOrder === 'desc' ? '↓' : '↑')}
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Thanh toán gần nhất
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {invoices.map((invoice) => {
              const severity = getSeverity(invoice.days_overdue);
              const severityConfig = SEVERITY_CONFIG[severity];

              return (
                <tr key={invoice.id} className={`hover:bg-muted/50 ${severityConfig.bgRow}`}>
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{invoice.student?.full_name || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3">
                    <div className="space-y-1">
                      {invoice.student?.phone && (
                        <a href={`tel:${invoice.student.phone}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                          <Phone className="w-3.5 h-3.5" />
                          {invoice.student.phone}
                        </a>
                      )}
                      {invoice.student?.email && (
                        <a href={`mailto:${invoice.student.email}`} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground">
                          <Mail className="w-3.5 h-3.5" />
                          <span className="truncate max-w-[150px]">{invoice.student.email}</span>
                        </a>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className="font-mono text-sm">{invoice.invoice_code}</span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold font-mono text-red-600">
                      {formatMoney(invoice.remaining_amount || invoice.final_amount - invoice.paid_amount)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm">{formatDate(invoice.due_date)}</span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${severityConfig.color}`}>
                      {invoice.days_overdue} ngày
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-muted-foreground">
                      {invoice.last_payment_date ? formatDate(invoice.last_payment_date) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-center gap-1">
                      {invoice.student?.phone && (
                        <a
                          href={`tel:${invoice.student.phone}`}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                          title="Gọi điện"
                        >
                          <Phone className="w-4 h-4" />
                        </a>
                      )}
                      {invoice.student?.email && (
                        <a
                          href={`mailto:${invoice.student.email}`}
                          className="p-1.5 text-muted-foreground hover:bg-muted rounded transition-colors"
                          title="Gửi email"
                        >
                          <Mail className="w-4 h-4" />
                        </a>
                      )}
                      <button
                        onClick={() => onAddToCallList(invoice)}
                        className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
                        title="Thêm vào danh sách gọi"
                      >
                        <Plus className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <TablePagination pagination={pagination} onPageChange={onPageChange} />
    </div>
  );
}


// ============================================
// CALL LIST TABLE COMPONENT
// ============================================
function CallListTable({ items, onUpdateItem, editingNote, setEditingNote, noteText, setNoteText }) {
  if (!items || items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 bg-card rounded-lg border">
        <Phone className="w-10 h-10 mb-2 text-muted-foreground/40" />
        <p className="text-sm font-medium text-foreground">Danh sách gọi trống</p>
        <p className="text-xs text-muted-foreground mt-1">Thêm hóa đơn quá hạn vào danh sách để theo dõi</p>
      </div>
    );
  }

  return (
    <div className="bg-card rounded-lg border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-full whitespace-nowrap md:whitespace-normal">
          <thead className="bg-muted/50">
            <tr className="border-b">
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Học viên
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Số điện thoại
              </th>
              <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground uppercase">
                Số tiền
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Ưu tiên
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Trạng thái
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Lần gọi cuối
              </th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground uppercase">
                Ghi chú
              </th>
              <th className="px-4 py-3 text-center text-xs font-semibold text-muted-foreground uppercase">
                Thao tác
              </th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map((item) => {
              const priorityConfig = PRIORITY_CONFIG[item.priority] || PRIORITY_CONFIG.normal;
              const statusConfig = CALL_STATUS_CONFIG[item.status] || CALL_STATUS_CONFIG.pending;

              return (
                <tr key={item.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <p className="font-medium text-foreground">{item.student?.full_name || 'N/A'}</p>
                  </td>
                  <td className="px-4 py-3">
                    {item.student?.phone ? (
                      <a href={`tel:${item.student.phone}`} className="flex items-center gap-1.5 text-sm text-blue-600 hover:underline">
                        <Phone className="w-3.5 h-3.5" />
                        {item.student.phone}
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <span className="font-semibold font-mono text-red-600">
                      {formatMoney(item.invoice?.remaining_amount || 0)}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${priorityConfig.color}`}>
                      {priorityConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className={`inline-flex px-2 py-1 rounded-full text-xs font-semibold ${statusConfig.color}`}>
                      {statusConfig.label}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span className="text-sm text-muted-foreground">
                      {item.last_call_at ? formatDate(item.last_call_at) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {editingNote === item.id ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          value={noteText}
                          onChange={(e) => setNoteText(e.target.value)}
                          className="flex-1 text-sm border rounded px-2 py-1 bg-background"
                          placeholder="Nhập ghi chú..."
                          autoFocus
                        />
                        <button
                          onClick={() => onUpdateItem(item.id, { notes: noteText })}
                          className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                        >
                          <CheckCircle className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setEditingNote(null)}
                          className="p-1 text-muted-foreground hover:bg-muted rounded"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <div
                        onClick={() => { setEditingNote(item.id); setNoteText(item.notes || ''); }}
                        className="text-sm text-muted-foreground cursor-pointer hover:text-foreground min-w-[100px]"
                      >
                        {item.notes || <span className="italic">Thêm ghi chú...</span>}
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <CallListActions item={item} onUpdateItem={onUpdateItem} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ============================================
// CALL LIST ACTIONS
// ============================================
function CallListActions({ item, onUpdateItem }) {
  return (
    <div className="flex items-center justify-center gap-1 flex-wrap">
      {item.status !== 'called' && item.status !== 'promised' && item.status !== 'paid' && (
        <button
          onClick={() => onUpdateItem(item.id, { status: 'called', last_call_at: new Date().toISOString() })}
          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
          title="Đánh dấu đã gọi"
        >
          <PhoneCall className="w-4 h-4" />
        </button>
      )}
      {item.status !== 'promised' && item.status !== 'paid' && (
        <button
          onClick={() => onUpdateItem(item.id, { status: 'promised' })}
          className="p-1.5 text-amber-600 hover:bg-amber-50 rounded transition-colors"
          title="Hẹn thanh toán"
        >
          <Calendar className="w-4 h-4" />
        </button>
      )}
      {item.status !== 'paid' && (
        <button
          onClick={() => onUpdateItem(item.id, { status: 'paid' })}
          className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded transition-colors"
          title="Đã thanh toán"
        >
          <CreditCard className="w-4 h-4" />
        </button>
      )}
      {item.status !== 'escalated' && item.status !== 'paid' && (
        <button
          onClick={() => onUpdateItem(item.id, { status: 'escalated' })}
          className="p-1.5 text-purple-600 hover:bg-purple-50 rounded transition-colors"
          title="Chuyển cấp"
        >
          <ArrowUpCircle className="w-4 h-4" />
        </button>
      )}
    </div>
  );
}

// ============================================
// TABLE PAGINATION
// ============================================
function TablePagination({ pagination, onPageChange }) {
  const { page, limit, total, totalPages } = pagination;

  if (totalPages <= 1) return null;

  const startItem = (page - 1) * limit + 1;
  const endItem = Math.min(page * limit, total);

  return (
    <div className="px-4 py-3 border-t flex items-center justify-between bg-muted/30">
      <p className="text-sm text-muted-foreground">
        Hiển thị <span className="font-medium text-foreground">{startItem}</span>
        –<span className="font-medium text-foreground">{endItem}</span>
        {' '}/ {total} kết quả
      </p>

      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>

        <span className="text-sm text-muted-foreground">
          Trang {page} / {totalPages}
        </span>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
        >
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
