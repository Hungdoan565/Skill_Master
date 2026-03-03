import React, { useState, useEffect, useCallback } from 'react';
import { 
  ClipboardCheck, UserPlus, Award, CreditCard, Wallet, 
  AlertTriangle, CalendarOff, Check, X, Loader2, Inbox, Clock 
} from 'lucide-react';
import { useAuth } from '@/contexts/auth-context';
import { useCenterContext } from '@/contexts/center-context';
import { gooeyToast } from 'goey-toast';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

const APPROVAL_TYPES = {
  enrollments: {
    label: 'Ghi danh',
    icon: UserPlus,
    color: 'blue',
    endpoint: '/api/admin/enrollment-requests?status=pending',
    approveEndpoint: (id) => `/api/admin/enrollment-requests/${id}/approve`,
    rejectEndpoint: (id) => `/api/admin/enrollment-requests/${id}/reject`,
    approveMethod: 'PATCH',
    rejectMethod: 'PATCH',
    rejectBodyKey: 'admin_note',
    getTitle: (item) => item.student?.full_name || item.student_name || 'Học viên',
    getSubtitle: (item) => item.class?.name || item.class_name || '',
  },
  certificates: {
    label: 'Chứng chỉ',
    icon: Award,
    color: 'purple',
    endpoint: '/api/admin/certificates/pending-approvals',
    approveEndpoint: (id) => `/api/admin/certificates/${id}/approve`,
    rejectEndpoint: (id) => `/api/admin/certificates/${id}/reject`,
    approveMethod: 'PUT',
    rejectMethod: 'PUT',
    rejectBodyKey: 'reason',
    getTitle: (item) => item.student?.full_name || 'Học viên',
    getSubtitle: (item) => `${item.course?.title || ''} - ${item.certificate_type_ref?.name || item.certificate_type || ''}`,
  },
  payments: {
    label: 'Thanh toán',
    icon: CreditCard,
    color: 'green',
    endpoint: '/api/payments/pending',
    approveEndpoint: (id) => `/api/payments/${id}/verify`,
    rejectEndpoint: (id) => `/api/payments/${id}/reject`,
    approveMethod: 'PATCH',
    rejectMethod: 'PATCH',
    rejectBodyKey: 'reason',
    getTitle: (item) => item.student_name || item.payer_name || 'Học viên',
    getSubtitle: (item) => `${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.amount || 0)}`,
  },
  payroll: {
    label: 'Lương',
    icon: Wallet,
    color: 'orange',
    endpoint: '/api/admin/payroll?status=pending',
    approveEndpoint: (id) => `/api/admin/payroll/${id}/status`,
    rejectEndpoint: (id) => `/api/admin/payroll/${id}/status`,
    approveMethod: 'PATCH',
    rejectMethod: 'PATCH',
    approveBody: { status: 'approved' },
    rejectBody: (reason) => ({ status: 'rejected', admin_note: reason }),
    getTitle: (item) => item.teacher?.full_name || item.teacher_name || 'Giáo viên',
    getSubtitle: (item) => `Tháng ${item.month || ''} - ${new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(item.total_amount || item.net_salary || 0)}`,
  },
  disputes: {
    label: 'Khiếu nại',
    icon: AlertTriangle,
    color: 'red',
    endpoint: '/api/admin/payroll-disputes?status=pending',
    approveEndpoint: (id) => `/api/admin/payroll-disputes/${id}`,
    rejectEndpoint: (id) => `/api/admin/payroll-disputes/${id}`,
    approveMethod: 'PATCH',
    rejectMethod: 'PATCH',
    approveBody: { status: 'resolved' },
    rejectBody: (reason) => ({ status: 'rejected', admin_response: reason }),
    getTitle: (item) => item.teacher?.full_name || item.teacher_name || 'Giáo viên',
    getSubtitle: (item) => item.dispute_type || item.title || 'Khiếu nại lương',
  },
  leaves: {
    label: 'Nghỉ phép',
    icon: CalendarOff,
    color: 'teal',
    endpoint: '/api/admin/leave-requests?status=pending',
    approveEndpoint: (id) => `/api/admin/leave-requests/${id}`,
    rejectEndpoint: (id) => `/api/admin/leave-requests/${id}`,
    approveMethod: 'PATCH',
    rejectMethod: 'PATCH',
    approveBody: { status: 'approved' },
    rejectBody: (reason) => ({ status: 'rejected', admin_note: reason }),
    getTitle: (item) => item.teacher?.full_name || 'Giáo viên',
    getSubtitle: (item) => {
      const types = { sick: 'Ốm', personal: 'Cá nhân', annual: 'Phép năm', other: 'Khác' };
      return `${types[item.leave_type] || item.leave_type || ''} · ${item.start_date || ''} → ${item.end_date || ''}`;
    },
  },
};

const COLOR_MAP = {
  blue: { text: 'text-blue-600', bg: 'bg-blue-100', border: 'border-blue-200', badge: 'bg-blue-100 text-blue-800' },
  purple: { text: 'text-purple-600', bg: 'bg-purple-100', border: 'border-purple-200', badge: 'bg-purple-100 text-purple-800' },
  green: { text: 'text-green-600', bg: 'bg-green-100', border: 'border-green-200', badge: 'bg-green-100 text-green-800' },
  orange: { text: 'text-orange-600', bg: 'bg-orange-100', border: 'border-orange-200', badge: 'bg-orange-100 text-orange-800' },
  red: { text: 'text-red-600', bg: 'bg-red-100', border: 'border-red-200', badge: 'bg-red-100 text-red-800' },
  teal: { text: 'text-teal-600', bg: 'bg-teal-100', border: 'border-teal-200', badge: 'bg-teal-100 text-teal-800' },
};

export default function ApprovalInboxPage() {
  const { session } = useAuth();
  const { selectedCenterId } = useCenterContext();

  
  const [activeTab, setActiveTab] = useState('all');
  const [counts, setCounts] = useState({});
  const [totalCount, setTotalCount] = useState(0);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [rejectDialog, setRejectDialog] = useState({ isOpen: false, type: null, itemId: null, reason: '' });

  const getQueryString = useCallback((url) => {
    if (!selectedCenterId) return url;
    return url.includes('?') ? `${url}&centerId=${selectedCenterId}` : `${url}?centerId=${selectedCenterId}`;
  }, [selectedCenterId]);

  const fetchCounts = useCallback(async () => {
    if (!session?.access_token) return;
    try {
      const url = getQueryString(`${API_URL}/api/admin/pending-approvals`);
      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${session.access_token}` }
      });
      const data = await response.json();
      if (data.success && data.data) {
        setCounts(data.data);
        const total = Object.values(data.data).reduce((sum, count) => sum + (count || 0), 0);
        setTotalCount(total);
      }
    } catch (error) {
      console.error('Failed to fetch counts', error);
    }
  }, [session?.access_token, getQueryString]);

  const fetchItems = useCallback(async () => {
    if (!session?.access_token) return;
    
    setIsLoading(true);
    try {
      if (activeTab === 'all') {
        const fetchPromises = Object.entries(APPROVAL_TYPES).map(async ([typeKey, config]) => {
          const url = getQueryString(`${API_URL}${config.endpoint}`);
          const res = await fetch(url, {
            headers: { Authorization: `Bearer ${session.access_token}` }
          });
          const data = await res.json();
          const list = data.data || data.enrollments || data.items || [];
          return list.map(item => ({ ...item, _type: typeKey }));
        });
        
        const results = await Promise.all(fetchPromises);
        const allItems = results.flat().sort((a, b) => new Date(b.created_at || b.createdAt || 0) - new Date(a.created_at || a.createdAt || 0));
        setItems(allItems);
      } else {
        const config = APPROVAL_TYPES[activeTab];
        const url = getQueryString(`${API_URL}${config.endpoint}`);
        const res = await fetch(url, {
          headers: { Authorization: `Bearer ${session.access_token}` }
        });
        const data = await res.json();
        const list = data.data || data.enrollments || data.items || [];
        setItems(list.map(item => ({ ...item, _type: activeTab })));
      }
    } catch (error) {
      gooeyToast.error('Không thể tải danh sách phê duyệt');
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, session?.access_token, getQueryString]);

  useEffect(() => {
    fetchCounts();
    fetchItems();
    
    const intervalId = setInterval(fetchCounts, 30000);
    return () => clearInterval(intervalId);
  }, [fetchCounts, fetchItems]);

  const handleApprove = async (type, itemId) => {
    try {
      const config = APPROVAL_TYPES[type];
      const url = getQueryString(`${API_URL}${config.approveEndpoint(itemId)}`);
      const body = config.approveBody || {};
      
      const response = await fetch(url, {
        method: config.approveMethod,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Lỗi phê duyệt');
      
      gooeyToast.success('Đã phê duyệt yêu cầu', {
        description: `Loại: ${config.label}`,
      });
      fetchCounts();
      fetchItems();
    } catch (error) {
      gooeyToast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  const handleRejectSubmit = async () => {
    if (!rejectDialog.reason.trim()) {
      gooeyToast.error('Vui lòng nhập lý do từ chối');
      return;
    }
    
    try {
      const config = APPROVAL_TYPES[rejectDialog.type];
      const url = getQueryString(`${API_URL}${config.rejectEndpoint(rejectDialog.itemId)}`);
      
      let body;
      if (config.rejectBody) {
        body = typeof config.rejectBody === 'function' ? config.rejectBody(rejectDialog.reason) : config.rejectBody;
      } else {
        body = { [config.rejectBodyKey]: rejectDialog.reason };
      }
      
      const response = await fetch(url, {
        method: config.rejectMethod,
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.access_token}` 
        },
        body: JSON.stringify(body),
      });
      
      const data = await response.json();
      if (!response.ok || !data.success) throw new Error(data.message || 'Lỗi từ chối');
      
      gooeyToast.success('Đã từ chối yêu cầu');
      setRejectDialog({ isOpen: false, type: null, itemId: null, reason: '' });
      fetchCounts();
      fetchItems();
    } catch (error) {
      gooeyToast.error(error.message || 'Có lỗi xảy ra');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="p-3 bg-primary/10 rounded-xl">
            <ClipboardCheck className="w-6 h-6 text-primary" />
          </div>
          <div>
            <div className="flex items-center space-x-2">
              <h1 className="text-2xl font-bold tracking-tight">Phê duyệt</h1>
              {totalCount > 0 && (
                <span className="px-2.5 py-0.5 rounded-full bg-red-100 text-red-700 text-xs font-semibold">
                  {totalCount} chờ xử lý
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mt-1">
              Quản lý tất cả yêu cầu phê duyệt từ các trung tâm
            </p>
          </div>
        </div>
      </div>

      <div className="flex overflow-x-auto border-b hide-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex-none whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-primary text-primary' 
              : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
          }`}
        >
          <div className="flex items-center space-x-2">
            <span>Tất cả</span>
            {totalCount > 0 && (
              <span className="bg-primary/10 text-primary px-2 py-0.5 rounded-full text-xs">
                {totalCount}
              </span>
            )}
          </div>
        </button>
        {Object.entries(APPROVAL_TYPES).map(([key, config]) => {
          const count = counts[key] || 0;
          return (
            <button
              key={key}
              onClick={() => setActiveTab(key)}
              className={`flex-none whitespace-nowrap px-4 py-3 text-sm font-medium border-b-2 transition-colors ${
                activeTab === key 
                  ? 'border-primary text-primary' 
                  : 'border-transparent text-muted-foreground hover:text-foreground hover:border-border'
              }`}
            >
              <div className="flex items-center space-x-2">
                <span>{config.label}</span>
                {count > 0 && (
                  <span className={`px-2 py-0.5 rounded-full text-xs ${COLOR_MAP[config.color].badge}`}>
                    {count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>

      <div className="space-y-4">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4" />
            <p>Đang tải danh sách...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 bg-card rounded-xl border border-dashed">
            <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
              <Inbox className="w-8 h-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium text-foreground">Không có yêu cầu nào</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Hiện tại không có yêu cầu nào cần phê duyệt trong mục này.
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {items.map((item) => {
              const config = APPROVAL_TYPES[item._type];
              if (!config) return null;
              const Icon = config.icon;
              const colors = COLOR_MAP[config.color];
              const date = new Date(item.created_at || item.createdAt || Date.now());

              return (
                <div key={`${item._type}-${item.id}`} className="flex flex-col sm:flex-row sm:items-center justify-between bg-card rounded-xl border p-4 hover:bg-muted/50 transition-colors gap-4">
                  <div className="flex items-start space-x-4">
                    <div className={`mt-1 flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center ${colors.bg} ${colors.text}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${colors.bg} ${colors.text}`}>
                          {config.label}
                        </span>
                        <div className="flex items-center text-xs text-muted-foreground">
                          <Clock className="w-3.5 h-3.5 mr-1" />
                          {date.toLocaleString('vi-VN')}
                        </div>
                      </div>
                      <h4 className="text-base font-semibold mt-1">{config.getTitle(item)}</h4>
                      <p className="text-sm text-muted-foreground">{config.getSubtitle(item)}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 sm:ml-auto">
                    <button
                      onClick={() => handleApprove(item._type, item.id)}
                      className="flex items-center justify-center flex-1 sm:flex-none border border-green-500/50 text-green-600 hover:bg-green-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      <Check className="w-4 h-4 mr-1.5" />
                      Phê duyệt
                    </button>
                    <button
                      onClick={() => setRejectDialog({ isOpen: true, type: item._type, itemId: item.id, reason: '' })}
                      className="flex items-center justify-center flex-1 sm:flex-none border border-red-500/50 text-red-600 hover:bg-red-50 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors"
                    >
                      <X className="w-4 h-4 mr-1.5" />
                      Từ chối
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {rejectDialog.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-card rounded-2xl p-6 w-full max-w-md shadow-xl">
            <h3 className="text-lg font-semibold mb-2">Lý do từ chối</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Vui lòng nhập lý do từ chối yêu cầu này. Lý do sẽ được gửi cho người tạo yêu cầu.
            </p>
            <textarea
              value={rejectDialog.reason}
              onChange={(e) => setRejectDialog(prev => ({ ...prev, reason: e.target.value }))}
              placeholder="Nhập lý do..."
              className="w-full rounded-xl border border-input bg-transparent px-3 py-2 text-sm shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring min-h-[100px] resize-none mb-6"
              autoFocus
            />
            <div className="flex items-center justify-end space-x-2">
              <button
                onClick={() => setRejectDialog({ isOpen: false, type: null, itemId: null, reason: '' })}
                className="px-4 py-2 rounded-lg text-sm font-medium hover:bg-muted transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={handleRejectSubmit}
                className="px-4 py-2 rounded-lg text-sm font-medium bg-red-600 text-white hover:bg-red-700 transition-colors"
              >
                Từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
