import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import {
  Calendar,
  Clock,
  Plus,
  Play,
  Trash2,
  FileBarChart,
  Loader2,
  X,
  Mail,
  CheckCircle2,
  Timer,
  Building2,
  Zap,
  Send,
  BarChart3,
  Users,
  GraduationCap,
  BookOpen,
  Briefcase,
  ClipboardList,
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';

/* ============================================================
   Inline Switch component with explicit colors
   ============================================================ */
const Switch = React.forwardRef(({ checked, onCheckedChange, disabled, className }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-indigo-600' : 'bg-slate-300 dark:bg-slate-600'} ${className || ''}`}
  >
    <span
      className={`pointer-events-none block h-5 w-5 rounded-full bg-white shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
));
Switch.displayName = "Switch";

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const REPORT_TYPES = [
  { value: 'revenue', label: 'Doanh thu', icon: BarChart3, color: 'text-emerald-600 bg-emerald-50' },
  { value: 'enrollment', label: 'Tuyển sinh', icon: Users, color: 'text-blue-600 bg-blue-50' },
  { value: 'attendance', label: 'Điểm danh', icon: ClipboardList, color: 'text-amber-600 bg-amber-50' },
  { value: 'grades', label: 'Điểm số', icon: GraduationCap, color: 'text-violet-600 bg-violet-50' },
  { value: 'staff', label: 'Nhân sự', icon: Briefcase, color: 'text-rose-600 bg-rose-50' },
  { value: 'courses', label: 'Khóa học', icon: BookOpen, color: 'text-cyan-600 bg-cyan-50' },
];

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Hàng ngày', desc: 'Gửi lúc 7:00 sáng mỗi ngày' },
  { value: 'weekly', label: 'Hàng tuần', desc: 'Gửi thứ 2 mỗi tuần' },
  { value: 'monthly', label: 'Hàng tháng', desc: 'Gửi ngày 1 mỗi tháng' },
];

const formSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên báo cáo'),
  description: z.string().optional(),
  report_type: z.string().min(1, 'Vui lòng chọn loại báo cáo'),
  schedule: z.string().min(1, 'Vui lòng chọn lịch gửi'),
  center_id: z.string().optional(),
  email_recipients: z.array(z.string().email('Email không hợp lệ')).min(1, 'Cần ít nhất 1 email'),
  is_active: z.boolean().default(true),
});

/* ============================================================
   EmailTagsInput — chip-style email input
   ============================================================ */
const EmailTagsInput = ({ value = [], onChange, error }) => {
  const [inputValue, setInputValue] = useState('');

  const addEmail = (raw) => {
    const email = raw.trim().replace(/,/g, '');
    if (!email) return;
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      gooeyToast.error('Email không hợp lệ');
      return;
    }
    if (value.includes(email)) {
      gooeyToast.error('Email đã tồn tại');
      return;
    }
    onChange([...value, email]);
    setInputValue('');
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      addEmail(inputValue);
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  return (
    <div className="space-y-1.5">
      <div className={`flex flex-wrap gap-1.5 p-2.5 min-h-[44px] border rounded-lg bg-white dark:bg-slate-900 transition-colors focus-within:ring-2 focus-within:ring-indigo-500/40 focus-within:border-indigo-500 ${error ? 'border-red-400' : 'border-slate-200 dark:border-slate-700'}`}>
        {value.map(email => (
          <span key={email} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700 text-xs font-medium dark:bg-indigo-900/30 dark:text-indigo-300">
            <Mail className="h-3 w-3" />
            {email}
            <button type="button" onClick={() => onChange(value.filter(e => e !== email))} className="ml-0.5 hover:text-red-500 transition-colors">
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => { if (inputValue.trim()) addEmail(inputValue); }}
          className="flex-1 bg-transparent outline-none min-w-[180px] text-sm placeholder:text-slate-400"
          placeholder={value.length === 0 ? "Nhập email, nhấn Enter để thêm..." : "Thêm email..."}
        />
      </div>
      {error && <p className="text-xs text-red-500">{error.message}</p>}
    </div>
  );
};

/* ============================================================
   Main component
   ============================================================ */
export default function ScheduledReportsPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [reports, setReports] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [runningId, setRunningId] = useState(null);
  const [deletingId, setDeletingId] = useState(null);

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      description: '',
      report_type: '',
      schedule: 'weekly',
      center_id: '',
      email_recipients: [],
      is_active: true,
    },
  });

  /* ----- Data fetching ----- */
  const fetchData = async () => {
    if (!token) return;
    setLoading(true);
    try {
      const [reportsRes, centersRes] = await Promise.all([
        fetch(`${API_URL}/api/admin/scheduled-reports`, {
          headers: { Authorization: `Bearer ${token}` }
        }),
        fetch(`${API_URL}/api/admin/centers`, {
          headers: { Authorization: `Bearer ${token}` }
        })
      ]);

      const reportsData = reportsRes.ok ? await reportsRes.json() : { success: false };
      const centersData = centersRes.ok ? await centersRes.json() : { success: false };

      if (reportsData.success) {
        setReports(reportsData.data || []);
      } else {
        console.error('Failed to fetch reports:', reportsData);
      }

      if (centersData.success) {
        setCenters(centersData.data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
      setReports([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  /* ----- Create report ----- */
  const onSubmit = async (values) => {
    setSubmitting(true);
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...values,
          center_id: values.center_id === 'all' ? null : (values.center_id || null),
          filters: {}
        })
      });

      const result = await response.json();
      if (result.success) {
        gooeyToast.success('Tạo cấu hình thành công!');
        setIsDialogOpen(false);
        form.reset();
        fetchData();
      } else {
        gooeyToast.error(result.message || 'Có lỗi xảy ra khi lưu');
      }
    } catch (error) {
      console.error('Save error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    } finally {
      setSubmitting(false);
    }
  };

  /* ----- Run now ----- */
  const handleRunNow = async (id) => {
    setRunningId(id);
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-reports/${id}/run-now`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();

      if (result.success) {
        gooeyToast.success('Đã xếp hàng gửi báo cáo!');
        fetchData();
      } else {
        gooeyToast.error(result.message || 'Không thể chạy báo cáo');
      }
    } catch (error) {
      console.error('Run error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    } finally {
      setRunningId(null);
    }
  };

  /* ----- Delete ----- */
  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa cấu hình báo cáo này?')) return;
    setDeletingId(id);
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        gooeyToast.success('Đã xóa cấu hình báo cáo');
        fetchData();
      } else {
        gooeyToast.error(result.message || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Delete error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    } finally {
      setDeletingId(null);
    }
  };

  /* ----- Helpers ----- */
  const formatDate = (dateString) => {
    if (!dateString) return '—';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getReportType = (val) => REPORT_TYPES.find(t => t.value === val) || { label: val, icon: FileBarChart, color: 'text-slate-600 bg-slate-50' };
  const getScheduleLabel = (val) => SCHEDULE_OPTIONS.find(t => t.value === val)?.label || val;

  /* ============================================================
     RENDER
     ============================================================ */
  return (
    <div className="container mx-auto p-4 sm:p-6 space-y-6 max-w-7xl">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 text-white shadow-lg shadow-indigo-200">
              <Send className="h-5 w-5" />
            </div>
            Báo cáo tự động
          </h1>
          <p className="text-sm text-muted-foreground mt-1.5 ml-[52px]">
            Lên lịch tự động gửi báo cáo qua email định kỳ
          </p>
        </div>

        <Button
          onClick={() => setIsDialogOpen(true)}
          className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-md shadow-indigo-200 transition-all hover:shadow-lg"
        >
          <Plus className="h-4 w-4" />
          Tạo lịch mới
        </Button>
      </div>

      {/* Stats row */}
      {!loading && reports.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Tổng cấu hình</p>
            <p className="text-2xl font-bold text-slate-900 dark:text-white">{reports.length}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Đang hoạt động</p>
            <p className="text-2xl font-bold text-emerald-600">{reports.filter(r => r.is_active).length}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Tạm dừng</p>
            <p className="text-2xl font-bold text-slate-400">{reports.filter(r => !r.is_active).length}</p>
          </div>
          <div className="rounded-xl border bg-white dark:bg-slate-900 p-4">
            <p className="text-xs font-medium text-muted-foreground mb-1">Email nhận</p>
            <p className="text-2xl font-bold text-indigo-600">
              {new Set(reports.flatMap(r => r.email_recipients || [])).size}
            </p>
          </div>
        </div>
      )}

      {/* Content */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4 text-indigo-500" />
          <p className="text-sm">Đang tải danh sách...</p>
        </div>
      ) : reports.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <div className="p-5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950 dark:to-violet-950 mb-6">
            <Send className="h-10 w-10 text-indigo-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có cấu hình nào</h3>
          <p className="text-sm text-muted-foreground max-w-md mb-6">
            Tạo lịch báo cáo tự động để nhận email doanh thu, tuyển sinh, điểm danh... định kỳ mà không cần thao tác thủ công.
          </p>
          <Button
            onClick={() => setIsDialogOpen(true)}
            className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
          >
            <Plus className="h-4 w-4" />
            Tạo cấu hình đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          {reports.map((report) => {
            const typeInfo = getReportType(report.report_type);
            const TypeIcon = typeInfo.icon;
            return (
            <Card key={report.id} className="flex flex-col overflow-hidden hover:shadow-md transition-shadow group border-slate-200 dark:border-slate-700">
              {/* Card top accent */}
              <div className={`h-1 ${report.is_active ? 'bg-gradient-to-r from-indigo-500 to-violet-500' : 'bg-slate-200'}`} />

              <CardHeader className="pb-3 pt-4">
                <div className="flex justify-between items-start gap-3">
                  <div className="flex items-start gap-3 min-w-0">
                    <div className={`p-2 rounded-lg shrink-0 ${typeInfo.color}`}>
                      <TypeIcon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0">
                      <CardTitle className="text-sm font-semibold truncate" title={report.name}>
                        {report.name}
                      </CardTitle>
                      <p className="text-xs text-muted-foreground mt-0.5">{typeInfo.label}</p>
                    </div>
                  </div>
                  <Badge
                    className={`shrink-0 text-[10px] px-2 py-0.5 ${
                      report.is_active
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                    }`}
                    variant="outline"
                  >
                    {report.is_active ? '● Hoạt động' : '○ Tạm dừng'}
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="pb-3 flex-1 space-y-3">
                {report.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{report.description}</p>
                )}

                {/* Meta grid */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-xs">
                    <Calendar className="h-3.5 w-3.5 text-indigo-500" />
                    <span className="text-muted-foreground">Tần suất:</span>
                    <span className="font-medium">{getScheduleLabel(report.schedule)}</span>
                  </div>
                  {report.center_name && (
                    <div className="flex items-center gap-2 text-xs">
                      <Building2 className="h-3.5 w-3.5 text-indigo-500" />
                      <span className="text-muted-foreground">Cơ sở:</span>
                      <span className="font-medium truncate">{report.center_name}</span>
                    </div>
                  )}
                  <div className="flex items-start gap-2 text-xs">
                    <Mail className="h-3.5 w-3.5 text-indigo-500 mt-0.5 shrink-0" />
                    <span className="text-muted-foreground shrink-0">Gửi tới:</span>
                    <span className="font-medium line-clamp-2">{report.email_recipients?.join(', ')}</span>
                  </div>
                </div>

                {/* Timestamps */}
                <div className="rounded-lg bg-slate-50 dark:bg-slate-800/50 p-2.5 space-y-1.5">
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <CheckCircle2 className="h-3 w-3" />
                      Lần cuối:
                    </span>
                    <span className="font-medium">{formatDate(report.last_run_at)}</span>
                  </div>
                  <div className="flex justify-between text-xs">
                    <span className="flex items-center gap-1.5 text-muted-foreground">
                      <Timer className="h-3 w-3" />
                      Tiếp theo:
                    </span>
                    <span className="font-medium text-indigo-600">{formatDate(report.next_run_at)}</span>
                  </div>
                </div>
              </CardContent>

              {/* Actions */}
              <div className="px-4 py-3 flex items-center gap-2 border-t bg-slate-50/50 dark:bg-slate-900/50">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1 gap-1.5 text-xs h-8 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200"
                  disabled={runningId === report.id}
                  onClick={() => handleRunNow(report.id)}
                >
                  {runningId === report.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Zap className="h-3.5 w-3.5" />
                  )}
                  Gửi ngay
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 w-8 p-0 hover:bg-red-50 hover:text-red-600 hover:border-red-200"
                  disabled={deletingId === report.id}
                  onClick={() => handleDelete(report.id)}
                  title="Xóa cấu hình"
                >
                  {deletingId === report.id ? (
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="h-3.5 w-3.5" />
                  )}
                </Button>
              </div>
            </Card>
          );
          })}
        </div>
      )}

      {/* ========== Create Dialog ========== */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[560px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-violet-600 text-white">
                <Plus className="h-4 w-4" />
              </div>
              Tạo cấu hình báo cáo tự động
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5 py-2">
            {/* Name */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Tên báo cáo <span className="text-red-500">*</span></Label>
              <Input {...form.register('name')} placeholder="Vd: Báo cáo doanh thu hàng tuần" className="h-10" />
              {form.formState.errors.name && (
                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
              )}
            </div>

            {/* Description */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Mô tả</Label>
              <Input {...form.register('description')} placeholder="Giải thích ngắn gọn..." className="h-10" />
            </div>

            {/* Report type + Schedule */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Loại dữ liệu <span className="text-red-500">*</span></Label>
                <Controller
                  name="report_type"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn loại" />
                      </SelectTrigger>
                      <SelectContent>
                        {REPORT_TYPES.map(type => (
                          <SelectItem key={type.value} value={type.value}>
                            <span className="flex items-center gap-2">
                              <type.icon className="h-3.5 w-3.5" />
                              {type.label}
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.report_type && (
                  <p className="text-xs text-red-500">{form.formState.errors.report_type.message}</p>
                )}
              </div>

              <div className="space-y-1.5">
                <Label className="text-sm font-medium">Tần suất <span className="text-red-500">*</span></Label>
                <Controller
                  name="schedule"
                  control={form.control}
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className="h-10">
                        <SelectValue placeholder="Chọn lịch" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCHEDULE_OPTIONS.map(opt => (
                          <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.schedule && (
                  <p className="text-xs text-red-500">{form.formState.errors.schedule.message}</p>
                )}
              </div>
            </div>

            {/* Center */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium text-muted-foreground">Cơ sở</Label>
              <Controller
                name="center_id"
                control={form.control}
                render={({ field }) => (
                  <Select onValueChange={field.onChange} value={field.value}>
                    <SelectTrigger className="h-10">
                      <SelectValue placeholder="Toàn bộ hệ thống" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Toàn bộ hệ thống</SelectItem>
                      {centers.map(center => (
                        <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Email recipients */}
            <div className="space-y-1.5">
              <Label className="text-sm font-medium">Email nhận báo cáo <span className="text-red-500">*</span></Label>
              <Controller
                name="email_recipients"
                control={form.control}
                render={({ field }) => (
                  <EmailTagsInput
                    value={field.value}
                    onChange={field.onChange}
                    error={form.formState.errors.email_recipients}
                  />
                )}
              />
              <p className="text-[11px] text-muted-foreground">Nhấn Enter hoặc phẩy (,) để thêm email</p>
            </div>

            {/* Active toggle */}
            <div className="flex items-center justify-between p-3 rounded-lg bg-slate-50 dark:bg-slate-800/50">
              <div>
                <Label className="text-sm font-medium">Kích hoạt ngay</Label>
                <p className="text-[11px] text-muted-foreground">Bật để báo cáo tự động chạy theo lịch</p>
              </div>
              <Controller
                name="is_active"
                control={form.control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>

            <DialogFooter className="pt-2 gap-2">
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Hủy
              </Button>
              <Button
                type="submit"
                disabled={submitting}
                className="gap-2 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Lưu cấu hình
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
