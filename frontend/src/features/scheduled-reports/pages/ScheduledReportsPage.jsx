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
  CardDescription,
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
  FileText,
  Loader2,
  X,
  Mail,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { gooeyToast } from 'goey-toast';

// Inline simple Switch component
const Switch = React.forwardRef(({ checked, onCheckedChange, disabled, className }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    disabled={disabled}
    ref={ref}
    onClick={() => onCheckedChange?.(!checked)}
    className={`peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${checked ? 'bg-primary' : 'bg-input'} ${className || ''}`}
  >
    <span
      data-state={checked ? 'checked' : 'unchecked'}
      className={`pointer-events-none block h-5 w-5 rounded-full bg-background shadow-lg ring-0 transition-transform ${checked ? 'translate-x-5' : 'translate-x-0'}`}
    />
  </button>
));
Switch.displayName = "Switch";

// Inline simple Separator component
const Separator = ({ className, orientation = "horizontal" }) => (
  <div
    role="none"
    className={`shrink-0 bg-border ${orientation === "horizontal" ? "h-[1px] w-full" : "h-full w-[1px]"} ${className || ''}`}
  />
);

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const REPORT_TYPES = [
  { value: 'revenue', label: 'Báo cáo doanh thu' },
  { value: 'enrollment', label: 'Báo cáo tuyển sinh' },
  { value: 'attendance', label: 'Báo cáo điểm danh' },
  { value: 'grades', label: 'Báo cáo điểm số' },
  { value: 'staff', label: 'Báo cáo nhân sự' },
  { value: 'courses', label: 'Báo cáo khóa học' },
];

const SCHEDULE_OPTIONS = [
  { value: 'daily', label: 'Hàng ngày' },
  { value: 'weekly', label: 'Hàng tuần' },
  { value: 'monthly', label: 'Hàng tháng' },
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

const EmailTagsInput = ({ value = [], onChange, error }) => {
  const [inputValue, setInputValue] = useState('');

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const newEmail = inputValue.trim().replace(',', '');
      if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail)) {
        if (!value.includes(newEmail)) {
          onChange([...value, newEmail]);
        }
        setInputValue('');
      } else if (newEmail) {
        gooeyToast.error('Email không hợp lệ');
      }
    } else if (e.key === 'Backspace' && !inputValue && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeEmail = (emailToRemove) => {
    onChange(value.filter(email => email !== emailToRemove));
  };

  return (
    <div className="space-y-2">
      <div className={`flex flex-wrap gap-2 p-2 min-h-10 border rounded-md bg-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 ${error ? 'border-destructive' : 'border-input'}`}>
        {value.map(email => (
          <Badge key={email} variant="secondary" className="flex items-center gap-1 hover:bg-secondary/80 text-xs">
            {email}
            <X className="h-3 w-3 cursor-pointer" onClick={() => removeEmail(email)} />
          </Badge>
        ))}
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            const newEmail = inputValue.trim();
            if (newEmail && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(newEmail) && !value.includes(newEmail)) {
               onChange([...value, newEmail]);
               setInputValue('');
            }
          }}
          className="flex-1 bg-transparent outline-none min-w-[150px] text-sm"
          placeholder={value.length === 0 ? "Nhập email và nhấn Enter..." : ""}
        />
      </div>
      {error && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  );
};

export default function ScheduledReportsPage() {
  const { session } = useAuth();
  const token = session?.access_token;

  const [reports, setReports] = useState([]);
  const [centers, setCenters] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
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

      const reportsData = await reportsRes.json();
      const centersData = await centersRes.json();

      if (reportsData.success) {
        setReports(reportsData.data || []);
      } else {
        gooeyToast.error('Không thể tải danh sách báo cáo');
      }

      if (centersData.success) {
        setCenters(centersData.data || []);
      }
    } catch (error) {
      console.error('Fetch error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  const onSubmit = async (values) => {
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-reports`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({ ...values, filters: {} })
      });

      const result = await response.json();
      if (result.success) {
        gooeyToast.success('Đã lưu cấu hình báo cáo', {
          description: `Báo cáo: ${values.name}`,
        });
        setIsDialogOpen(false);
        form.reset();
        fetchData();
      } else {
        gooeyToast.error(result.message || 'Có lỗi xảy ra khi lưu');
      }
    } catch (error) {
      console.error('Save error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    }
  };

  const handleRunNow = async (id) => {
    setRunningId(id);
    try {
      const runNowPromise = (async () => {
        const response = await fetch(`${API_URL}/api/admin/scheduled-reports/${id}/run-now`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` }
        });
        const result = await response.json();

        if (!result.success) {
          throw new Error(result.message || 'Không thể chạy báo cáo lúc này');
        }

        fetchData();
        return result;
      });

      await gooeyToast.promise(runNowPromise, {
        loading: 'Đang xếp hàng đợi gửi báo cáo...',
        success: 'Đã xếp hàng đợi gửi báo cáo!',
        error: 'Lỗi khi gửi báo cáo'
      });
    } catch (error) {
      console.error('Run error:', error);
    } finally {
      setRunningId(null);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Bạn có chắc chắn muốn xóa báo cáo tự động này?')) return;
    const reportName = reports.find((report) => report.id === id)?.name;
    
    setDeletingId(id);
    try {
      const response = await fetch(`${API_URL}/api/admin/scheduled-reports/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      });
      const result = await response.json();
      if (result.success) {
        gooeyToast.success('Đã xóa báo cáo tự động', {
          description: `Báo cáo: ${reportName || 'Không xác định'}`,
        });
        fetchData();
      } else {
        gooeyToast.error(result.message || 'Có lỗi xảy ra khi xóa');
      }
    } catch (error) {
      console.error('Delete error:', error);
      gooeyToast.error('Lỗi kết nối máy chủ');
    } finally {
      setDeletingId(null);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Chưa từng chạy';
    return new Date(dateString).toLocaleString('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    });
  };

  const getReportTypeLabel = (val) => REPORT_TYPES.find(t => t.value === val)?.label || val;
  const getScheduleLabel = (val) => SCHEDULE_OPTIONS.find(t => t.value === val)?.label || val;

  return (
    <div className="container mx-auto p-6 space-y-6 max-w-6xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground">Báo cáo tự động</h1>
          <p className="text-muted-foreground mt-1">
            Quản lý và lên lịch tự động gửi email báo cáo hệ thống.
          </p>
        </div>
        
        <Button className="gap-2" onClick={() => setIsDialogOpen(true)}>
          <Plus className="h-4 w-4" />
          Tạo lịch mới
        </Button>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[550px]">
            <DialogHeader>
              <DialogTitle>Tạo cấu hình báo cáo tự động</DialogTitle>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
              
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Tên báo cáo *</Label>
                  <Input {...form.register('name')} placeholder="Vd: Báo cáo doanh thu hàng tuần" />
                  {form.formState.errors.name && (
                    <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label>Mô tả (Tùy chọn)</Label>
                  <Input {...form.register('description')} placeholder="Giải thích ngắn gọn về báo cáo" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Loại dữ liệu *</Label>
                    <Controller
                      name="report_type"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn loại báo cáo" />
                          </SelectTrigger>
                          <SelectContent>
                            {REPORT_TYPES.map(type => (
                              <SelectItem key={type.value} value={type.value}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                    {form.formState.errors.report_type && (
                      <p className="text-sm text-destructive">{form.formState.errors.report_type.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label>Tần suất gửi *</Label>
                    <Controller
                      name="schedule"
                      control={form.control}
                      render={({ field }) => (
                        <Select onValueChange={field.onChange} value={field.value}>
                          <SelectTrigger>
                            <SelectValue placeholder="Chọn tần suất" />
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
                      <p className="text-sm text-destructive">{form.formState.errors.schedule.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Cơ sở (Tùy chọn)</Label>
                  <Controller
                    name="center_id"
                    control={form.control}
                    render={({ field }) => (
                      <Select onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger>
                          <SelectValue placeholder="Toàn bộ hệ thống" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Toàn bộ hệ thống</SelectItem>
                          {centers.map(center => (
                            <SelectItem key={center.id} value={center.id}>{center.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Email nhận báo cáo *</Label>
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
                  <p className="text-xs text-muted-foreground">Nhập email và nhấn Enter hoặc phẩy (,) để thêm</p>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-base">Kích hoạt</Label>
                    <p className="text-sm text-muted-foreground">Cho phép báo cáo này tự động chạy theo lịch</p>
                  </div>
                  <Controller
                    name="is_active"
                    control={form.control}
                    render={({ field }) => (
                      <Switch checked={field.value} onCheckedChange={field.onChange} />
                    )}
                  />
                </div>
              </div>
              
              <DialogFooter className="pt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Hủy
                </Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Lưu cấu hình
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
          <Loader2 className="h-8 w-8 animate-spin mb-4" />
          <p>Đang tải danh sách báo cáo...</p>
        </div>
      ) : reports.length === 0 ? (
        <Card className="flex flex-col items-center justify-center py-24 text-center border-dashed">
          <div className="bg-primary/10 p-4 rounded-full mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h3 className="text-lg font-semibold mb-2">Chưa có báo cáo tự động</h3>
          <p className="text-muted-foreground max-w-sm mb-6">
            Bạn chưa cấu hình bất kỳ báo cáo tự động nào. Hãy tạo lịch để nhận báo cáo định kỳ qua email.
          </p>
          <Button onClick={() => setIsDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Tạo cấu hình đầu tiên
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {reports.map((report) => (
            <Card key={report.id} className="flex flex-col overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg truncate pr-2" title={report.name}>
                      {report.name}
                    </CardTitle>
                    <CardDescription className="mt-1 line-clamp-1">
                      {getReportTypeLabel(report.report_type)}
                    </CardDescription>
                  </div>
                  <Badge variant={report.is_active ? 'default' : 'secondary'} className="shrink-0">
                    {report.is_active ? 'Hoạt động' : 'Tạm dừng'}
                  </Badge>
                </div>
              </CardHeader>
              
              <CardContent className="pb-4 flex-1">
                <div className="space-y-4">
                  {report.description && (
                    <p className="text-sm text-muted-foreground line-clamp-2">{report.description}</p>
                  )}
                  
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm">
                    <div className="flex items-center text-muted-foreground">
                      <Calendar className="mr-2 h-4 w-4" />
                      <span>{getScheduleLabel(report.schedule)}</span>
                    </div>
                    {report.center_name && (
                      <div className="flex items-center text-muted-foreground truncate" title={report.center_name}>
                        <AlertCircle className="mr-2 h-4 w-4" />
                        <span className="truncate">{report.center_name}</span>
                      </div>
                    )}
                    <div className="col-span-2 flex items-start text-muted-foreground">
                      <Mail className="mr-2 h-4 w-4 mt-0.5 shrink-0" />
                      <span className="line-clamp-2">{report.email_recipients?.join(', ')}</span>
                    </div>
                  </div>

                  <Separator />

                  <div className="space-y-2 text-xs text-muted-foreground">
                    <div className="flex justify-between">
                      <span className="flex items-center"><CheckCircle className="mr-1 h-3 w-3" /> Lần chạy cuối:</span>
                      <span className="font-medium">{formatDate(report.last_run_at)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="flex items-center"><Clock className="mr-1 h-3 w-3" /> Chạy tiếp theo:</span>
                      <span className="font-medium text-foreground">{formatDate(report.next_run_at)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
              
              <div className="bg-muted/50 p-4 flex items-center gap-2 mt-auto border-t">
                <Button 
                  variant="default" 
                  size="sm" 
                  className="flex-1 gap-2"
                  disabled={runningId === report.id}
                  onClick={() => handleRunNow(report.id)}
                >
                  {runningId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Chạy ngay
                </Button>
                <Button 
                  variant="destructive" 
                  size="sm"
                  className="px-3"
                  disabled={deletingId === report.id}
                  onClick={() => handleDelete(report.id)}
                  title="Xóa cấu hình"
                >
                  {deletingId === report.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
