/**
 * SalaryConfigPage Component
 * Trang quản lý cấu hình lương giáo viên
 */

import { useEffect, useState, useCallback } from 'react';
import {
  DollarSign,
  Search,
  Users,
  Clock,
  Briefcase,
  Edit2,
  History,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import axios from 'axios';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/lib/supabaseClient';
import { useToast } from '@/components/ui/toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const getAuthHeaders = async () => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.access_token) throw new Error('Chưa đăng nhập');
  return { Authorization: `Bearer ${session.access_token}` };
};

// Format currency
const formatCurrency = (value) => {
  return new Intl.NumberFormat('vi-VN').format(value || 0) + 'đ';
};

// Pay scheme config
const PAY_SCHEME_CONFIG = {
  HOURLY_ONLY: {
    label: 'Lương theo giờ',
    color: 'bg-blue-100 text-blue-800',
    icon: Clock,
    description: 'Part-time, sinh viên',
  },
  FIXED_ONLY: {
    label: 'Lương cố định',
    color: 'bg-green-100 text-green-800',
    icon: Briefcase,
    description: 'Nhân viên cố định',
  },
  FIXED_PLUS_HOURLY: {
    label: 'Cố định + Giờ',
    color: 'bg-purple-100 text-purple-800',
    icon: DollarSign,
    description: 'Full-time + dạy thêm',
  },
};

const PAY_SCHEME_OPTIONS = [
  { value: 'HOURLY_ONLY', label: 'Chỉ lương theo giờ' },
  { value: 'FIXED_PLUS_HOURLY', label: 'Lương cố định + Giờ dạy thêm' },
  { value: 'FIXED_ONLY', label: 'Chỉ lương cố định' },
];

export function SalaryConfigPage() {
  const [configs, setConfigs] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [schemeFilter, setSchemeFilter] = useState('');
  const [editModal, setEditModal] = useState({ isOpen: false, config: null });
  const [historyModal, setHistoryModal] = useState({ isOpen: false, teacherId: null, history: [] });
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();

  // Fetch configs
  const fetchConfigs = useCallback(async () => {
    try {
      setLoading(true);
      const headers = await getAuthHeaders();
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (schemeFilter) params.append('pay_scheme', schemeFilter);

      const response = await axios.get(
        `${API_URL}/api/admin/teacher-compensation?${params}`,
        { headers }
      );

      if (response.data?.success) {
        setConfigs(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching configs:', error);
      toast.error('Không thể tải dữ liệu cấu hình lương');
    } finally {
      setLoading(false);
    }
  }, [search, schemeFilter, toast]);

  // Fetch stats
  const fetchStats = useCallback(async () => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/admin/teacher-compensation-stats`,
        { headers }
      );
      if (response.data?.success) {
        setStats(response.data.data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  }, []);

  useEffect(() => {
    fetchConfigs();
    fetchStats();
  }, [fetchConfigs, fetchStats]);

  // Fetch history for a teacher
  const fetchHistory = async (teacherId) => {
    try {
      const headers = await getAuthHeaders();
      const response = await axios.get(
        `${API_URL}/api/admin/teacher-compensation/${teacherId}`,
        { headers }
      );
      if (response.data?.success) {
        setHistoryModal({
          isOpen: true,
          teacherId,
          history: response.data.data.all || [],
        });
      }
    } catch (error) {
      toast.error('Không thể tải lịch sử');
    }
  };

  // Save config
  const handleSaveConfig = async (formData) => {
    try {
      setSubmitting(true);
      const headers = await getAuthHeaders();

      if (editModal.config?.id) {
        // Update existing
        await axios.put(
          `${API_URL}/api/admin/teacher-compensation/${editModal.config.id}`,
          formData,
          { headers }
        );
        toast.success('Cập nhật cấu hình lương thành công');
      } else {
        // Create new
        await axios.post(
          `${API_URL}/api/admin/teacher-compensation`,
          formData,
          { headers }
        );
        toast.success('Tạo cấu hình lương thành công');
      }

      setEditModal({ isOpen: false, config: null });
      fetchConfigs();
      fetchStats();
    } catch (error) {
      console.error('Error saving config:', error);
      toast.error(error.response?.data?.message || 'Có lỗi xảy ra');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Cấu hình lương giáo viên</h1>
          <p className="text-muted-foreground">
            Quản lý mức lương theo giờ và lương cố định cho giáo viên
          </p>
        </div>
        <Button onClick={() => fetchConfigs()} variant="outline">
          <RefreshCw className="mr-2 h-4 w-4" />
          Làm mới
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Tổng giáo viên</span>
              <Users className="h-4 w-4 text-slate-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.total || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Lương theo giờ</span>
              <Clock className="h-4 w-4 text-blue-500" />
            </div>
            <p className="text-2xl font-bold text-blue-600">
              {stats?.by_scheme?.HOURLY_ONLY || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Cố định + Giờ</span>
              <DollarSign className="h-4 w-4 text-purple-500" />
            </div>
            <p className="text-2xl font-bold text-purple-600">
              {stats?.by_scheme?.FIXED_PLUS_HOURLY || 0}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">TB lương/giờ</span>
              <DollarSign className="h-4 w-4 text-orange-500" />
            </div>
            <p className="text-2xl font-bold text-orange-600">
              {formatCurrency(stats?.avg_hourly_rate || 0)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <select
          value={schemeFilter}
          onChange={(e) => setSchemeFilter(e.target.value)}
          className="rounded-md border px-3 py-2 text-sm"
        >
          <option value="">Tất cả loại hình</option>
          {PAY_SCHEME_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5" />
            Danh sách cấu hình lương ({configs.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-slate-400" />
            </div>
          ) : configs.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Không có cấu hình lương nào</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left text-sm text-muted-foreground">
                    <th className="pb-3 font-medium">Giáo viên</th>
                    <th className="pb-3 font-medium">Loại hình</th>
                    <th className="pb-3 font-medium text-right">Lương/giờ</th>
                    <th className="pb-3 font-medium text-right">Lương cố định</th>
                    <th className="pb-3 font-medium">Hiệu lực từ</th>
                    <th className="pb-3 font-medium text-right">Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {configs.map((config) => {
                    const scheme = PAY_SCHEME_CONFIG[config.pay_scheme];
                    const SchemeIcon = scheme?.icon || DollarSign;
                    return (
                      <tr key={config.id} className="border-b last:border-0">
                        <td className="py-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-orange-100 flex items-center justify-center text-orange-700 font-medium">
                              {config.teacher?.full_name?.[0] || '?'}
                            </div>
                            <div>
                              <p className="font-medium">{config.teacher?.full_name}</p>
                              <p className="text-sm text-muted-foreground">
                                {config.teacher?.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4">
                          <Badge className={scheme?.color}>
                            <SchemeIcon className="h-3 w-3 mr-1" />
                            {scheme?.label}
                          </Badge>
                        </td>
                        <td className="py-4 text-right font-medium">
                          {config.hourly_rate ? formatCurrency(config.hourly_rate) : '-'}
                        </td>
                        <td className="py-4 text-right font-medium">
                          {config.fixed_monthly_salary > 0
                            ? formatCurrency(config.fixed_monthly_salary)
                            : '-'}
                        </td>
                        <td className="py-4 text-sm">
                          {new Date(config.effective_from).toLocaleDateString('vi-VN')}
                        </td>
                        <td className="py-4">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditModal({ isOpen: true, config })}
                            >
                              <Edit2 className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => fetchHistory(config.teacher_id)}
                            >
                              <History className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Modal */}
      {editModal.isOpen && (
        <EditConfigModal
          config={editModal.config}
          onClose={() => setEditModal({ isOpen: false, config: null })}
          onSave={handleSaveConfig}
          submitting={submitting}
        />
      )}

      {/* History Modal */}
      {historyModal.isOpen && (
        <HistoryModal
          history={historyModal.history}
          onClose={() => setHistoryModal({ isOpen: false, teacherId: null, history: [] })}
        />
      )}
    </div>
  );
}

// Edit Config Modal Component
function EditConfigModal({ config, onClose, onSave, submitting }) {
  const [formData, setFormData] = useState({
    pay_scheme: config?.pay_scheme || 'HOURLY_ONLY',
    hourly_rate: config?.hourly_rate || 150000,
    fixed_monthly_salary: config?.fixed_monthly_salary || 0,
    extra_hourly_rate: config?.extra_hourly_rate || null,
    notes: config?.notes || '',
  });

  const showHourlyRate = formData.pay_scheme !== 'FIXED_ONLY';
  const showFixedSalary = formData.pay_scheme !== 'HOURLY_ONLY';

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-md rounded-lg bg-white shadow-xl mx-4">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Chỉnh sửa cấu hình lương - {config?.teacher?.full_name}
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Pay Scheme */}
            <div className="space-y-2">
              <Label>Loại hình trả lương</Label>
              <select
                value={formData.pay_scheme}
                onChange={(e) => setFormData((prev) => ({ ...prev, pay_scheme: e.target.value }))}
                className="w-full rounded-md border px-3 py-2 text-sm"
              >
                {PAY_SCHEME_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Hourly Rate */}
            {showHourlyRate && (
              <div className="space-y-2">
                <Label>Mức lương/giờ</Label>
                <Input
                  type="number"
                  min="0"
                  step="10000"
                  value={formData.hourly_rate}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, hourly_rate: parseInt(e.target.value) || 0 }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  = {formatCurrency(formData.hourly_rate)}/giờ
                </p>
              </div>
            )}

            {/* Fixed Salary */}
            {showFixedSalary && (
              <div className="space-y-2">
                <Label>Lương cố định/tháng</Label>
                <Input
                  type="number"
                  min="0"
                  step="100000"
                  value={formData.fixed_monthly_salary}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      fixed_monthly_salary: parseInt(e.target.value) || 0,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  = {formatCurrency(formData.fixed_monthly_salary)}/tháng
                </p>
              </div>
            )}

            {/* Notes */}
            <div className="space-y-2">
              <Label>Ghi chú</Label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData((prev) => ({ ...prev, notes: e.target.value }))}
                placeholder="Ghi chú về cấu hình lương..."
                rows={2}
                className="w-full rounded-md border px-3 py-2 text-sm resize-none"
              />
            </div>

            {/* Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button type="button" variant="outline" onClick={onClose} disabled={submitting}>
                Hủy
              </Button>
              <Button type="submit" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Đang lưu...
                  </>
                ) : (
                  'Lưu thay đổi'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

// History Modal Component
function HistoryModal({ history, onClose }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className="relative z-10 w-full max-w-lg rounded-lg bg-white shadow-xl mx-4 max-h-[80vh] overflow-y-auto">
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4">Lịch sử cấu hình lương</h3>

          {history.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">Không có lịch sử</p>
          ) : (
            <div className="space-y-4">
              {history.map((item, idx) => {
                const scheme = PAY_SCHEME_CONFIG[item.pay_scheme];
                const isActive = !item.effective_to;
                return (
                  <div
                    key={item.id}
                    className={`p-4 rounded-lg border ${isActive ? 'border-green-300 bg-green-50' : 'bg-slate-50'}`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <Badge className={scheme?.color}>{scheme?.label}</Badge>
                      {isActive && (
                        <Badge className="bg-green-100 text-green-800">Đang hiệu lực</Badge>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span className="text-muted-foreground">Lương/giờ:</span>
                        <span className="ml-2 font-medium">{formatCurrency(item.hourly_rate)}</span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Cố định:</span>
                        <span className="ml-2 font-medium">
                          {formatCurrency(item.fixed_monthly_salary)}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Từ:</span>
                        <span className="ml-2">
                          {new Date(item.effective_from).toLocaleDateString('vi-VN')}
                        </span>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Đến:</span>
                        <span className="ml-2">
                          {item.effective_to
                            ? new Date(item.effective_to).toLocaleDateString('vi-VN')
                            : 'Hiện tại'}
                        </span>
                      </div>
                    </div>
                    {item.notes && (
                      <p className="text-xs text-muted-foreground mt-2 italic">{item.notes}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end pt-4 border-t mt-4">
            <Button onClick={onClose}>Đóng</Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SalaryConfigPage;
