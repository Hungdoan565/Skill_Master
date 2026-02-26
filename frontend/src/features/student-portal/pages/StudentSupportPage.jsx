import React, { useState } from 'react';
import { useStudentSupport } from '../hooks';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { HeadphonesIcon, AlertTriangle, Plus, Clock, Tag, ChevronRight, RefreshCw, Send } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useToast } from '@/components/ui/toast';

const STATUS_MAP = {
  open: { label: 'Mở', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' },
  in_progress: { label: 'Đang xử lý', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400' },
  resolved: { label: 'Đã giải quyết', color: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' },
  closed: { label: 'Đã đóng', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-400' },
};

const CATEGORY_MAP = {
  academic: 'Học vụ',
  technical: 'Kỹ thuật',
  financial: 'Tài chính',
  other: 'Khác'
};

const PRIORITY_MAP = {
  low: { label: 'Thấp', color: 'text-gray-500 bg-gray-100 dark:bg-gray-800 dark:text-gray-400' },
  medium: { label: 'Trung bình', color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30 dark:text-blue-400' },
  high: { label: 'Cao', color: 'text-red-600 bg-red-100 dark:bg-red-900/30 dark:text-red-400' }
};

export default function StudentSupportPage() {
  const { tickets, loading, error, createTicket, refetch } = useStudentSupport();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    subject: '',
    category: 'academic',
    priority: 'medium',
    message: ''
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.subject.trim() || !formData.message.trim()) return;

    setSubmitting(true);
    const result = await createTicket(formData);
    setSubmitting(false);

    if (result.success) {
      toast({
        title: 'Thành công',
        description: 'Đã gửi yêu cầu hỗ trợ. Chúng tôi sẽ phản hồi sớm nhất.',
        type: 'success'
      });
      setIsModalOpen(false);
      setFormData({
        subject: '',
        category: 'academic',
        priority: 'medium',
        message: ''
      });
    } else {
      toast({
        title: 'Lỗi',
        description: result.error,
        type: 'error'
      });
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    return new Intl.DateTimeFormat('vi-VN', {
      day: '2-digit', month: '2-digit', year: 'numeric',
      hour: '2-digit', minute: '2-digit'
    }).format(new Date(dateString));
  };

  if (loading && !tickets.length) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto" />
          <p className="mt-4 text-muted-foreground">Đang tải dữ liệu...</p>
        </div>
      </div>
    );
  }

  if (error && !tickets.length) {
    return (
      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mb-4 opacity-80" />
          <h2 className="text-xl font-semibold mb-2">Đã xảy ra lỗi</h2>
          <p className="text-muted-foreground mb-6 max-w-md">{error}</p>
          <Button onClick={refetch} className="bg-emerald-600 hover:bg-emerald-700">
            <RefreshCw className="mr-2 h-4 w-4" /> Thử lại
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8 space-y-6">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-500 p-6 sm:p-8 shadow-lg mb-8">
        <div className="relative z-10 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-2 text-white">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight flex items-center gap-3">
              <HeadphonesIcon className="h-8 w-8 opacity-90" />
              Hỗ trợ
            </h1>
            <p className="text-emerald-50 text-base sm:text-lg max-w-xl">
              Gửi yêu cầu hỗ trợ và theo dõi tiến độ xử lý
            </p>
          </div>
          <Button 
            onClick={() => setIsModalOpen(true)}
            className="bg-white text-emerald-700 hover:bg-emerald-50 shadow-sm border-0"
            size="lg"
          >
            <Plus className="mr-2 h-5 w-5" />
            Tạo yêu cầu hỗ trợ
          </Button>
        </div>
        
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 -translate-y-12 translate-x-1/3 opacity-10 pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg">
            <path fill="#ffffff" d="M44.7,-76.4C58.8,-69.2,71.8,-59.1,81.3,-46.3C90.8,-33.5,96.8,-18.1,97.3,-2.6C97.8,12.9,92.8,28.5,83.9,41.9C75,55.3,62.2,66.5,47.9,73.5C33.6,80.5,17.8,83.3,2.4,79.1C-13.1,74.9,-28.1,63.7,-41.8,54.1C-55.5,44.5,-67.9,36.5,-75.4,24.8C-82.9,13.1,-85.5,-2.3,-81.4,-15.8C-77.3,-29.3,-66.5,-40.9,-54.2,-49.2C-41.9,-57.5,-28.1,-62.5,-14.6,-66.1C-1.1,-69.7,12.1,-71.9,26.5,-73.4C40.9,-74.9,56.5,-75.7,44.7,-76.4Z" transform="translate(100 100)" />
          </svg>
        </div>
      </div>

      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold tracking-tight">Yêu cầu của bạn</h2>
        <Button variant="ghost" size="sm" onClick={refetch} disabled={loading} className="text-muted-foreground">
          <RefreshCw className={cn("h-4 w-4 mr-2", loading && "animate-spin")} />
          Làm mới
        </Button>
      </div>

      {/* Ticket List */}
      {tickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground bg-white dark:bg-gray-900 rounded-xl border shadow-sm">
          <div className="h-20 w-20 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mb-4">
            <HeadphonesIcon className="h-10 w-10 text-emerald-600 dark:text-emerald-400" />
          </div>
          <p className="text-lg font-medium text-foreground mb-2">Chưa có yêu cầu hỗ trợ nào</p>
          <p className="text-sm mb-6 max-w-sm text-center">Bạn có thể tạo yêu cầu hỗ trợ nếu gặp bất kỳ vấn đề nào về học tập, kỹ thuật hoặc học phí.</p>
          <Button onClick={() => setIsModalOpen(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="mr-2 h-4 w-4" /> Tạo yêu cầu đầu tiên
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {tickets.map(ticket => {
            const statusConfig = STATUS_MAP[ticket.status] || STATUS_MAP.open;
            const priorityConfig = PRIORITY_MAP[ticket.priority] || PRIORITY_MAP.medium;
            
            return (
              <Card key={ticket.id} className="hover:shadow-md transition-shadow group overflow-hidden border-l-4" style={{ borderLeftColor: ticket.status === 'open' ? '#3b82f6' : ticket.status === 'in_progress' ? '#f59e0b' : ticket.status === 'resolved' ? '#10b981' : '#9ca3af' }}>
                <CardContent className="p-5">
                  <div className="flex justify-between items-start mb-3">
                    <span className="font-mono text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                      #{ticket.ticket_number}
                    </span>
                    <Badge variant="outline" className={cn("border-0 font-medium", statusConfig.color)}>
                      {statusConfig.label}
                    </Badge>
                  </div>
                  
                  <h3 className="font-semibold text-base line-clamp-2 mb-3 group-hover:text-emerald-600 transition-colors">
                    {ticket.subject}
                  </h3>
                  
                  <div className="space-y-2 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center gap-2">
                      <Tag className="h-3.5 w-3.5" />
                      <span>{CATEGORY_MAP[ticket.category] || ticket.category}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="h-3.5 w-3.5" />
                      <span>{formatDate(ticket.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t flex items-center justify-between">
                    <Badge variant="secondary" className={cn("text-xs border-0", priorityConfig.color)}>
                      {priorityConfig.label}
                    </Badge>
                    <Button variant="ghost" size="sm" className="h-8 text-emerald-600 px-2 group-hover:bg-emerald-50 dark:group-hover:bg-emerald-950/50">
                      Chi tiết <ChevronRight className="h-4 w-4 ml-1" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Create Ticket Modal */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-xl">
              <HeadphonesIcon className="h-5 w-5 text-emerald-600" />
              Tạo yêu cầu hỗ trợ mới
            </DialogTitle>
            <DialogDescription>
              Vui lòng cung cấp chi tiết về vấn đề bạn đang gặp phải. Chúng tôi sẽ phản hồi trong thời gian sớm nhất.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-5 py-4">
            <div className="space-y-2">
              <Label htmlFor="subject" className="font-medium">Tiêu đề <span className="text-red-500">*</span></Label>
              <Input
                id="subject"
                placeholder="VD: Không thể xem video bài giảng"
                value={formData.subject}
                onChange={e => setFormData({ ...formData, subject: e.target.value })}
                required
                className="focus-visible:ring-emerald-500"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category" className="font-medium">Danh mục</Label>
                <Select
                  value={formData.category}
                  onValueChange={val => setFormData({ ...formData, category: val })}
                >
                  <SelectTrigger className="focus:ring-emerald-500">
                    <SelectValue placeholder="Chọn danh mục" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="academic">Học vụ</SelectItem>
                    <SelectItem value="technical">Kỹ thuật</SelectItem>
                    <SelectItem value="financial">Tài chính</SelectItem>
                    <SelectItem value="other">Khác</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="priority" className="font-medium">Mức độ ưu tiên</Label>
                <Select
                  value={formData.priority}
                  onValueChange={val => setFormData({ ...formData, priority: val })}
                >
                  <SelectTrigger className="focus:ring-emerald-500">
                    <SelectValue placeholder="Chọn mức độ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Thấp</SelectItem>
                    <SelectItem value="medium">Trung bình</SelectItem>
                    <SelectItem value="high">Cao</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="message" className="font-medium">Nội dung chi tiết <span className="text-red-500">*</span></Label>
              <Textarea
                id="message"
                placeholder="Mô tả rõ vấn đề của bạn..."
                className="min-h-[120px] resize-none focus-visible:ring-emerald-500"
                value={formData.message}
                onChange={e => setFormData({ ...formData, message: e.target.value })}
                required
              />
            </div>
            
            <DialogFooter className="pt-2">
              <Button type="button" variant="outline" onClick={() => setIsModalOpen(false)}>
                Hủy bỏ
              </Button>
              <Button type="submit" disabled={submitting || !formData.subject.trim() || !formData.message.trim()} className="bg-emerald-600 hover:bg-emerald-700">
                {submitting ? (
                  <><RefreshCw className="mr-2 h-4 w-4 animate-spin" /> Đang gửi...</>
                ) : (
                  <><Send className="mr-2 h-4 w-4" /> Gửi yêu cầu</>
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}