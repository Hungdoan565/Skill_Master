import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/auth-context';
import { useCenterContext } from '@/contexts/center-context';
import { gooeyToast } from 'goey-toast';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { cn } from '@/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { vi } from 'date-fns/locale';
import {
  Bell,
  History,
  Plus,
  Edit2,
  Trash2,
  CheckCircle,
  AlertTriangle,
  Info,
  Clock,
  Check,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Checkbox } from '@/components/ui/checkbox';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const METRIC_TYPES = {
  revenue_drop: "Doanh thu giảm",
  low_attendance: "Tỉ lệ đi học thấp",
  high_debt: "Công nợ cao",
  pending_approvals: "Phê duyệt tồn đọng",
  low_enrollment: "Tuyển sinh thấp"
};

const OPERATORS = {
  gt: "Lớn hơn (>)",
  lt: "Nhỏ hơn (<)",
  gte: "≥",
  lte: "≤"
};

const SEVERITIES = {
  info: { label: 'Thông tin', color: 'blue' },
  warning: { label: 'Cảnh báo', color: 'amber' },
  critical: { label: 'Nghiêm trọng', color: 'red' }
};

const Switch = React.forwardRef(({ className, checked, onCheckedChange, disabled, ...props }, ref) => (
  <button
    type="button"
    role="switch"
    aria-checked={checked}
    data-state={checked ? 'checked' : 'unchecked'}
    disabled={disabled}
    className={cn(
      "peer inline-flex h-5 w-9 shrink-0 cursor-pointer items-center rounded-full border-2 border-transparent shadow-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-indigo-600 data-[state=unchecked]:bg-muted",
      className
    )}
    onClick={() => !disabled && onCheckedChange?.(!checked)}
    ref={ref}
    {...props}
  >
    <span
      data-state={checked ? 'checked' : 'unchecked'}
      className="pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform data-[state=checked]:translate-x-4 data-[state=unchecked]:translate-x-0"
    />
  </button>
));
Switch.displayName = "Switch";

const alertRuleSchema = z.object({
  name: z.string().min(1, 'Vui lòng nhập tên quy tắc'),
  metric_type: z.string().min(1, 'Vui lòng chọn loại số liệu'),
  condition_operator: z.string().min(1, 'Vui lòng chọn toán tử'),
  threshold_value: z.number({ invalid_type_error: 'Giá trị phải là số' }).min(0, 'Giá trị không hợp lệ'),
  severity: z.string().min(1, 'Vui lòng chọn mức độ cảnh báo'),
  notification_channels: z.array(z.string()).min(1, 'Chọn ít nhất 1 kênh thông báo'),
  is_active: z.boolean().default(true),
  cooldown_minutes: z.number({ invalid_type_error: 'Phút chờ phải là số' }).min(0, 'Phút chờ không hợp lệ').default(60),
});

export default function CustomAlertsPage() {
  const { session } = useAuth();
  const { selectedCenterId } = useCenterContext();
  
  const [activeTab, setActiveTab] = useState('rules');
  const [rules, setRules] = useState([]);
  const [history, setHistory] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const [isRuleModalOpen, setIsRuleModalOpen] = useState(false);
  const [editingRule, setEditingRule] = useState(null);
  
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deletingRuleId, setDeletingRuleId] = useState(null);

  const { register, handleSubmit, control, reset, formState: { errors } } = useForm({
    resolver: zodResolver(alertRuleSchema),
    defaultValues: {
      name: '',
      metric_type: 'revenue_drop',
      condition_operator: 'gt',
      threshold_value: 0,
      severity: 'warning',
      notification_channels: ['in_app'],
      is_active: true,
      cooldown_minutes: 60,
    }
  });

  const getQueryString = useCallback((url) => {
    if (!selectedCenterId) return url;
    return url.includes('?') ? `${url}&centerId=${selectedCenterId}` : `${url}?centerId=${selectedCenterId}`;
  }, [selectedCenterId]);

  const fetchData = useCallback(async () => {
    if (!session?.access_token) return;
    setIsLoading(true);
    try {
      const headers = { Authorization: `Bearer ${session.access_token}` };
      
      const [rulesRes, historyRes] = await Promise.all([
        fetch(getQueryString(`${API_URL}/api/admin/custom-alerts`), { headers }),
        fetch(getQueryString(`${API_URL}/api/admin/alert-history`), { headers })
      ]);
      
      const rulesData = await rulesRes.json();
      const historyData = await historyRes.json();
      
      if (rulesData.success) setRules(rulesData.data || []);
      if (historyData.success) setHistory(historyData.data || []);
      
    } catch (error) {
      console.error('Failed to fetch alerts data', error);
      gooeyToast.error('Không thể tải dữ liệu cảnh báo');
    } finally {
      setIsLoading(false);
    }
  }, [session?.access_token, getQueryString]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreateModal = () => {
    setEditingRule(null);
    reset({
      name: '',
      metric_type: 'revenue_drop',
      condition_operator: 'gt',
      threshold_value: 0,
      severity: 'warning',
      notification_channels: ['in_app'],
      is_active: true,
      cooldown_minutes: 60,
    });
    setIsRuleModalOpen(true);
  };

  const openEditModal = (rule) => {
    setEditingRule(rule);
    reset({
      name: rule.name,
      metric_type: rule.metric_type,
      condition_operator: rule.condition_operator,
      threshold_value: rule.threshold_value,
      severity: rule.severity,
      notification_channels: rule.notification_channels || ['in_app'],
      is_active: rule.is_active,
      cooldown_minutes: rule.cooldown_minutes,
    });
    setIsRuleModalOpen(true);
  };

  const confirmDelete = (id) => {
    setDeletingRuleId(id);
    setIsDeleteDialogOpen(true);
  };

  const handleDelete = async () => {
    try {
      const res = await fetch(`${API_URL}/api/admin/custom-alerts/${deletingRuleId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi xóa');
      
      gooeyToast.success('Đã xóa quy tắc cảnh báo');
      setIsDeleteDialogOpen(false);
      fetchData();
    } catch (error) {
      gooeyToast.error(error.message || 'Có lỗi xảy ra khi xóa');
    }
  };

  const handleToggleRule = async (ruleId, isActive) => {
    try {
      const rule = rules.find(r => r.id === ruleId);
      if (!rule) return;
      
      const res = await fetch(`${API_URL}/api/admin/custom-alerts/${ruleId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify({ ...rule, is_active: isActive })
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi cập nhật trạng thái');
      
      gooeyToast.success(isActive ? 'Đã bật quy tắc' : 'Đã tắt quy tắc');
      fetchData();
    } catch (error) {
      gooeyToast.error(error.message || 'Lỗi cập nhật');
    }
  };

  const onSubmit = async (formData) => {
    try {
      const payload = { ...formData, center_id: selectedCenterId || null };
      const url = editingRule 
        ? `${API_URL}/api/admin/custom-alerts/${editingRule.id}` 
        : `${API_URL}/api/admin/custom-alerts`;
      const method = editingRule ? 'PUT' : 'POST';
      
      const res = await fetch(url, {
        method,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi lưu');
      
      gooeyToast.success(editingRule ? 'Đã cập nhật quy tắc' : 'Đã tạo quy tắc mới', {
        description: `Quy tắc: ${formData.name}`,
      });
      setIsRuleModalOpen(false);
      fetchData();
    } catch (error) {
      gooeyToast.error(error.message || 'Lỗi khi lưu');
    }
  };

  const handleAcknowledge = async (id) => {
    try {
      const res = await fetch(`${API_URL}/api/admin/alert-history/${id}/acknowledge`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Lỗi khi xác nhận');
      
      gooeyToast.success('Đã xác nhận cảnh báo');
      fetchData();
    } catch (error) {
      gooeyToast.error(error.message || 'Lỗi khi xác nhận');
    }
  };

  const getSeverityBadge = (severity) => {
    const s = SEVERITIES[severity] || SEVERITIES.info;
    let colorClass = 'bg-blue-500/15 text-blue-700 dark:text-blue-400 border-transparent hover:bg-blue-500/25';
    if (s.color === 'amber') colorClass = 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-transparent hover:bg-amber-500/25';
    if (s.color === 'red') colorClass = 'bg-red-500/15 text-red-700 dark:text-red-400 border-transparent hover:bg-red-500/25';
    
    return (
      <Badge className={cn(colorClass, 'font-medium', 'shadow-none')}>
        {s.label}
      </Badge>
    );
  };

  const getSeverityIcon = (severity) => {
    switch(severity) {
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'critical': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-indigo-100 text-indigo-700 rounded-xl">
            <Bell className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Cảnh báo hệ thống</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Thiết lập và quản lý các quy tắc cảnh báo tự động cho trung tâm
            </p>
          </div>
        </div>
        
        {activeTab === 'rules' && (
          <Button onClick={openCreateModal} className="shrink-0 shadow-sm bg-indigo-600 hover:bg-indigo-700 text-white">
            <Plus className="w-4 h-4 mr-2" />
            Tạo quy tắc mới
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6 bg-muted p-1 w-full sm:w-auto flex sm:inline-flex rounded-lg h-12">
          <TabsTrigger value="rules" className="flex-1 sm:flex-none h-10 px-6 rounded-md data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
            <Bell className="w-4 h-4 mr-2" />
            Quy tắc cảnh báo
          </TabsTrigger>
          <TabsTrigger value="history" className="flex-1 sm:flex-none h-10 px-6 rounded-md data-[state=active]:bg-card data-[state=active]:text-indigo-600 data-[state=active]:shadow-sm">
            <History className="w-4 h-4 mr-2" />
            Lịch sử cảnh báo
            {history.filter(h => !h.acknowledged).length > 0 && (
              <Badge variant="destructive" className="ml-2 h-5 w-5 p-0 flex items-center justify-center rounded-full text-[10px]">
                {history.filter(h => !h.acknowledged).length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="rules" className="space-y-4 outline-none">
          <Card className="shadow-sm border-border overflow-hidden">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground h-12">Tên quy tắc</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Điều kiện</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Mức độ</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Kênh thông báo</TableHead>
                    <TableHead className="font-semibold text-foreground h-12 text-center">Trạng thái</TableHead>
                    <TableHead className="font-semibold text-foreground h-12 text-right pr-6">Thao tác</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : rules.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="h-32 text-center text-muted-foreground">
                        Không có quy tắc cảnh báo nào. Hãy{' '}
                        <button onClick={openCreateModal} className="text-indigo-600 font-medium hover:underline">tạo mới</button>{' '}
                        một quy tắc.
                      </TableCell>
                    </TableRow>
                  ) : (
                    rules.map((rule) => (
                      <TableRow key={rule.id} className="group">
                        <TableCell className="font-medium align-top">
                          <div className="flex flex-col gap-1.5 mt-1">
                            <span className="text-foreground">{rule.name}</span>
                            {rule.trigger_count > 0 && (
                              <span className="text-xs text-muted-foreground flex items-center">
                                <History className="w-3.5 h-3.5 mr-1" />
                                Đã kích hoạt {rule.trigger_count} lần
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex items-center space-x-2 text-sm mt-1">
                            <span className="text-muted-foreground">{METRIC_TYPES[rule.metric_type]}</span>
                            <span className="font-semibold text-foreground">{OPERATORS[rule.condition_operator]}</span>
                            <Badge variant="secondary" className="font-mono text-xs bg-muted text-foreground">
                              {rule.threshold_value}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="mt-1">{getSeverityBadge(rule.severity)}</div>
                        </TableCell>
                        <TableCell className="align-top">
                          <div className="flex flex-wrap gap-1 mt-1">
                            {rule.notification_channels?.map(ch => (
                              <Badge key={ch} variant="outline" className="text-[10px] bg-white text-muted-foreground uppercase border-border shadow-sm">
                                {ch === 'in_app' ? 'In-App' : ch}
                              </Badge>
                            ))}
                          </div>
                        </TableCell>
                        <TableCell className="text-center align-top">
                          <div className="mt-1 flex justify-center">
                            <Switch 
                              checked={rule.is_active} 
                              onCheckedChange={(checked) => handleToggleRule(rule.id, checked)} 
                            />
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top pr-4">
                          <div className="flex items-center justify-end space-x-1 mt-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="ghost" size="icon" onClick={() => openEditModal(rule)} className="h-8 w-8 text-muted-foreground hover:text-indigo-600 hover:bg-primary/10">
                              <Edit2 className="w-4 h-4" />
                            </Button>
                            <Button variant="ghost" size="icon" onClick={() => confirmDelete(rule.id)} className="h-8 w-8 text-muted-foreground hover:text-red-600 hover:bg-destructive/10">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="history" className="space-y-4 outline-none">
          <Card className="shadow-sm border-border overflow-hidden">
            <div className="relative w-full overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="bg-muted/50 hover:bg-muted/50">
                    <TableHead className="font-semibold text-foreground w-12 h-12"></TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Nội dung cảnh báo</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Thời gian</TableHead>
                    <TableHead className="font-semibold text-foreground h-12">Quy tắc / Trung tâm</TableHead>
                    <TableHead className="font-semibold text-foreground h-12 text-right pr-6">Trạng thái</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center">
                        <Loader2 className="w-6 h-6 animate-spin mx-auto text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : history.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="h-32 text-center text-muted-foreground">
                        Không có lịch sử cảnh báo nào gần đây.
                      </TableCell>
                    </TableRow>
                  ) : (
                    history.map((item) => (
                      <TableRow key={item.id} className={cn(!item.acknowledged && "bg-primary/5", "group")}>
                        <TableCell className="align-top pt-4">
                          <div className={cn("p-1.5 rounded-lg inline-flex", 
                            item.severity === 'warning' ? "bg-amber-500/15" : 
                            item.severity === 'critical' ? "bg-red-500/15" : "bg-blue-500/15"
                          )}>
                            {getSeverityIcon(item.severity)}
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="flex flex-col gap-1.5">
                            <span className={cn("text-sm leading-relaxed", !item.acknowledged ? "font-semibold text-foreground" : "text-foreground")}>
                              {item.message}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              Giá trị ghi nhận: <Badge variant="secondary" className="ml-1.5 px-1.5 py-0 text-[10px] bg-white border-border text-foreground">{item.metric_value}</Badge>
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="flex flex-col gap-1">
                            <span className="text-sm font-medium text-foreground">
                              {new Date(item.triggered_at).toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              {formatDistanceToNow(new Date(item.triggered_at), { addSuffix: true, locale: vi })}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="align-top pt-4">
                          <div className="flex flex-col gap-1.5">
                            <span className="text-sm text-foreground font-medium">{item.rule_name}</span>
                            <span className="text-xs text-muted-foreground flex items-center">
                              <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground/30 mr-1.5" />
                              {item.center_name || 'Tất cả trung tâm'}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right align-top pt-4 pr-4">
                          {item.acknowledged ? (
                            <div className="flex flex-col items-end gap-1">
                              <span className="flex items-center text-xs font-medium text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-1 rounded-md">
                                <CheckCircle className="w-3.5 h-3.5 mr-1" /> Đã xác nhận
                              </span>
                              <span className="text-[10px] text-muted-foreground">
                                bởi {item.acknowledged_by || 'Admin'}
                              </span>
                            </div>
                          ) : (
                            <Button size="sm" onClick={() => handleAcknowledge(item.id)} className="h-8 shadow-sm bg-white border-border text-foreground hover:bg-muted hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                              <Check className="w-3.5 h-3.5 mr-1.5" /> Xác nhận
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </Card>
        </TabsContent>
      </Tabs>

      {/* CREATE / EDIT DIALOG */}
      <Dialog open={isRuleModalOpen} onOpenChange={setIsRuleModalOpen}>
        <DialogContent className="sm:max-w-[600px] p-0 overflow-hidden gap-0">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle className="text-xl">{editingRule ? 'Sửa quy tắc cảnh báo' : 'Thêm quy tắc mới'}</DialogTitle>
            <DialogDescription className="mt-2 text-muted-foreground">
              Thiết lập điều kiện để hệ thống tự động gửi cảnh báo khi có sự cố.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit(onSubmit)} className="p-6 pt-6 space-y-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div className="space-y-2.5 sm:col-span-2">
                <Label htmlFor="name" className="text-foreground font-medium">Tên quy tắc</Label>
                <Input 
                  id="name" 
                  placeholder="Ví dụ: Cảnh báo sụt giảm doanh thu" 
                  {...register('name')} 
                  className={errors.name ? 'border-red-500 focus:ring-red-500/20' : ''}
                />
                {errors.name && <p className="text-xs text-red-500 font-medium mt-1">{errors.name.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-foreground font-medium">Loại số liệu</Label>
                <Controller
                  control={control}
                  name="metric_type"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.metric_type ? 'border-red-500 focus:ring-red-500/20' : ''}>
                        <SelectValue placeholder="Chọn loại số liệu" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(METRIC_TYPES).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.metric_type && <p className="text-xs text-red-500 font-medium mt-1">{errors.metric_type.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-foreground font-medium">Mức độ nghiêm trọng</Label>
                <Controller
                  control={control}
                  name="severity"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.severity ? 'border-red-500 focus:ring-red-500/20' : ''}>
                        <SelectValue placeholder="Chọn mức độ" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="info">
                          <span className="flex items-center"><Info className="w-4 h-4 mr-2 text-blue-500"/> Thông tin (Info)</span>
                        </SelectItem>
                        <SelectItem value="warning">
                          <span className="flex items-center"><AlertTriangle className="w-4 h-4 mr-2 text-amber-500"/> Cảnh báo (Warning)</span>
                        </SelectItem>
                        <SelectItem value="critical">
                          <span className="flex items-center"><AlertCircle className="w-4 h-4 mr-2 text-red-500"/> Nghiêm trọng (Critical)</span>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.severity && <p className="text-xs text-red-500 font-medium mt-1">{errors.severity.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label className="text-foreground font-medium">Toán tử</Label>
                <Controller
                  control={control}
                  name="condition_operator"
                  render={({ field }) => (
                    <Select onValueChange={field.onChange} value={field.value}>
                      <SelectTrigger className={errors.condition_operator ? 'border-red-500 focus:ring-red-500/20' : ''}>
                        <SelectValue placeholder="Toán tử" />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(OPERATORS).map(([key, val]) => (
                          <SelectItem key={key} value={key}>{val}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.condition_operator && <p className="text-xs text-red-500 font-medium mt-1">{errors.condition_operator.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="threshold_value" className="text-foreground font-medium">Ngưỡng (Value)</Label>
                <Input 
                  id="threshold_value" 
                  type="number"
                  step="0.01"
                  {...register('threshold_value', { valueAsNumber: true })} 
                  className={errors.threshold_value ? 'border-red-500 focus:ring-red-500/20' : ''}
                />
                {errors.threshold_value && <p className="text-xs text-red-500 font-medium mt-1">{errors.threshold_value.message}</p>}
              </div>

              <div className="space-y-2.5">
                <Label htmlFor="cooldown_minutes" className="text-foreground font-medium">Phút chờ (Cooldown)</Label>
                <Input 
                  id="cooldown_minutes" 
                  type="number"
                  {...register('cooldown_minutes', { valueAsNumber: true })} 
                  className={errors.cooldown_minutes ? 'border-red-500 focus:ring-red-500/20' : ''}
                />
                <p className="text-[11px] text-muted-foreground mt-1">Thời gian chờ giữa 2 lần cảnh báo liên tiếp</p>
                {errors.cooldown_minutes && <p className="text-xs text-red-500 font-medium">{errors.cooldown_minutes.message}</p>}
              </div>

              <div className="space-y-3">
                <Label className="text-foreground font-medium">Kênh thông báo</Label>
                <div className="flex flex-col space-y-3 mt-2 bg-muted p-3 rounded-md border border-border">
                  <Controller
                    control={control}
                    name="notification_channels"
                    render={({ field }) => (
                      <>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <Checkbox 
                            checked={field.value.includes('in_app')}
                            onCheckedChange={(checked) => {
                              const newValue = checked 
                                ? [...field.value, 'in_app'] 
                                : field.value.filter(v => v !== 'in_app');
                              field.onChange(newValue);
                            }}
                          />
                          <span className="text-sm font-medium text-foreground group-hover:text-foreground">In-App (Thông báo web)</span>
                        </label>
                        <label className="flex items-center space-x-3 cursor-pointer group">
                          <Checkbox 
                            checked={field.value.includes('email')}
                            onCheckedChange={(checked) => {
                              const newValue = checked 
                                ? [...field.value, 'email'] 
                                : field.value.filter(v => v !== 'email');
                              field.onChange(newValue);
                            }}
                          />
                          <span className="text-sm font-medium text-foreground group-hover:text-foreground">Email</span>
                        </label>
                      </>
                    )}
                  />
                </div>
                {errors.notification_channels && <p className="text-xs text-red-500 font-medium mt-1">{errors.notification_channels.message}</p>}
              </div>

              <div className="space-y-2 sm:col-span-2 flex items-center justify-between p-4 bg-muted border border-border rounded-lg">
                <div className="flex flex-col gap-1">
                  <Label className="text-sm font-semibold text-foreground">Trạng thái hoạt động</Label>
                  <span className="text-xs text-muted-foreground">Bật hoặc tắt quy tắc cảnh báo này</span>
                </div>
                <Controller
                  control={control}
                  name="is_active"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} />
                  )}
                />
              </div>
            </div>

            <DialogFooter className="pt-6 border-t mt-8 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => setIsRuleModalOpen(false)} className="bg-card">Hủy</Button>
              <Button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingRule ? 'Lưu thay đổi' : 'Tạo quy tắc'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* DELETE CONFIRM DIALOG */}
      <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <DialogContent className="sm:max-w-[400px] p-0 overflow-hidden">
          <div className="p-6">
            <div className="flex flex-col items-center text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-red-500/15 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="space-y-2">
                <h3 className="text-lg font-semibold text-foreground">Xóa quy tắc cảnh báo</h3>
                <p className="text-sm text-muted-foreground">
                  Bạn có chắc chắn muốn xóa quy tắc này? Hành động này không thể hoàn tác và các cảnh báo mới sẽ không được tạo.
                </p>
              </div>
            </div>
          </div>
          <div className="bg-muted p-4 border-t border-border flex justify-end gap-3">
            <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} className="bg-card">Hủy bỏ</Button>
            <Button variant="destructive" onClick={handleDelete} className="bg-red-600 hover:bg-red-700">Xác nhận xóa</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
