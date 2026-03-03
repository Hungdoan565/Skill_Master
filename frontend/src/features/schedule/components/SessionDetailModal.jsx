/**
 * SessionDetailModal - Modal xem chi tiết buổi học
 * Style đồng bộ với CreateCourseModal (màu cam-đỏ)
 */

import { 
  X, 
  Calendar,
  Clock,
  User,
  DoorOpen,
  Building2,
  BookOpen,
  Hash,
  CheckCircle,
  XCircle,
  AlertTriangle,
  PlayCircle,
  Users,
  FileText
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const STATUS_CONFIG = {
  scheduled: { 
    label: 'Chưa học', 
    color: 'bg-blue-100 text-blue-700',
    icon: Calendar,
    description: 'Buổi học chưa đến giờ'
  },
  in_progress: { 
    label: 'Đang học', 
    color: 'bg-amber-100 text-amber-700',
    icon: PlayCircle,
    description: 'Buổi học đang diễn ra'
  },
  overdue: { 
    label: 'Quá hạn', 
    color: 'bg-red-100 text-red-700',
    icon: AlertTriangle,
    description: 'Đã qua giờ, chưa điểm danh'
  },
  completed: { 
    label: 'Hoàn thành', 
    color: 'bg-green-100 text-green-700',
    icon: CheckCircle,
    description: 'Đã điểm danh xong'
  },
  cancelled: { 
    label: 'Đã hủy', 
    color: 'bg-slate-100 text-slate-500',
    icon: XCircle,
    description: 'Buổi học bị hủy'
  }
};

// Get actual status based on current time
const getDisplayStatus = (session) => {
  if (!session) return 'scheduled';
  if (session.status === 'completed') return 'completed';
  if (session.status === 'cancelled') return 'cancelled';
  
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  
  if (now >= sessionStart && now <= sessionEnd) return 'in_progress';
  if (now > sessionEnd) return 'overdue';
  return 'scheduled';
};

// Format date nicely
const formatDateNice = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  const options = { weekday: 'long', day: '2-digit', month: '2-digit', year: 'numeric' };
  const formatted = date.toLocaleDateString('vi-VN', options);
  
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  
  if (dateOnly(date) === dateOnly(today)) {
    return `Hôm nay - ${formatted}`;
  }
  if (dateOnly(date) === dateOnly(tomorrow)) {
    return `Ngày mai - ${formatted}`;
  }
  return formatted;
};

export function SessionDetailModal({ 
  isOpen, 
  onClose, 
  session 
}) {
  if (!isOpen || !session) return null;

  const displayStatus = session.displayStatus || getDisplayStatus(session);
  const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.scheduled;
  const StatusIcon = statusConfig.icon;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal - Style giống CreateCourseModal */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-hidden flex flex-col animate-in fade-in zoom-in-95 duration-200">
        {/* Header - Màu cam-đỏ giống Course */}
        <div className="bg-linear-to-r from-red-500 to-orange-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-white/20 rounded-lg">
                <Calendar className="w-5 h-5 text-white" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-white">Chi tiết buổi học</h2>
                <p className="text-sm text-white/80">Buổi #{session.session_number}</p>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-white" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {/* Status Card */}
          <div className={`p-3 rounded-xl border ${
            displayStatus === 'overdue' ? 'bg-red-50 border-red-200' :
            displayStatus === 'in_progress' ? 'bg-amber-50 border-amber-200' :
            displayStatus === 'completed' ? 'bg-green-50 border-green-200' :
            displayStatus === 'cancelled' ? 'bg-slate-50 border-slate-200' :
            'bg-blue-50 border-blue-200'
          }`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <StatusIcon className={`w-5 h-5 ${
                  displayStatus === 'overdue' ? 'text-red-600' :
                  displayStatus === 'in_progress' ? 'text-amber-600' :
                  displayStatus === 'completed' ? 'text-green-600' :
                  displayStatus === 'cancelled' ? 'text-slate-500' :
                  'text-blue-600'
                }`} />
                <div>
                  <p className="font-medium text-sm">{statusConfig.label}</p>
                  <p className="text-xs text-slate-500">{statusConfig.description}</p>
                </div>
              </div>
              <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>
          </div>

          {/* Class Info Card */}
          <div className="p-4 bg-orange-50 rounded-xl border border-orange-100">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-orange-100 flex items-center justify-center shrink-0">
                <BookOpen className="w-6 h-6 text-orange-600" />
              </div>
              <div className="min-w-0">
                <h4 className="font-semibold text-slate-900 truncate">
                  {session.classes?.name || 'N/A'}
                </h4>
                <p className="text-sm text-orange-600">{session.classes?.code}</p>
              </div>
            </div>
          </div>

          {/* Info Grid */}
          <div className="grid grid-cols-2 gap-3">
            {/* Date */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Calendar className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Ngày học</span>
              </div>
              <p className="text-sm font-medium text-slate-900">
                {formatDateNice(session.session_date)}
              </p>
            </div>

            {/* Time */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Clock className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Thời gian</span>
              </div>
              <p className="text-sm font-medium text-slate-900">
                {session.start_time?.slice(0, 5)} - {session.end_time?.slice(0, 5)}
              </p>
              <p className="text-xs text-slate-500">
                {session.duration_hours || 2} giờ
              </p>
            </div>

            {/* Session Number */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Hash className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Số buổi</span>
              </div>
              <p className="text-sm font-medium text-slate-900">
                Buổi {session.session_number}
              </p>
            </div>

            {/* Capacity */}
            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-center gap-2 text-slate-500 mb-1">
                <Users className="w-4 h-4 text-orange-500" />
                <span className="text-xs font-medium">Sĩ số</span>
              </div>
              <p className="text-sm font-medium text-slate-900">
                {session.classes?.current_students || 0}/{session.classes?.max_students || '?'} học viên
              </p>
            </div>
          </div>

          {/* Teacher Card */}
          <div className="p-4 bg-blue-50 rounded-xl border border-blue-100">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                {session.users?.avatar_url ? (
                  <img src={session.users.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover" />
                ) : (
                  <User className="w-5 h-5 text-blue-600" />
                )}
              </div>
              <div>
                <p className="text-xs text-blue-600 font-medium">Giáo viên</p>
                <p className="font-medium text-slate-900">
                  {session.users?.full_name || (
                    <span className="text-amber-600">Chưa phân công</span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Room & Center */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-purple-50 rounded-xl border border-purple-100">
              <div className="flex items-center gap-2">
                <DoorOpen className="w-4 h-4 text-purple-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-purple-600 font-medium">Phòng học</p>
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {session.rooms?.name || session.classes?.rooms?.name || (
                      <span className="text-amber-600">Chưa xếp</span>
                    )}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
              <div className="flex items-center gap-2">
                <Building2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs text-emerald-600 font-medium">Trung tâm</p>
                  <p className="font-medium text-slate-900 text-sm truncate">
                    {session.classes?.centers?.name || 'N/A'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Topic if exists */}
          {session.topic && (
            <div className="p-4 bg-amber-50 rounded-xl border border-amber-100">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-amber-600 font-medium mb-1">Chủ đề buổi học</p>
                  <p className="text-sm text-slate-700">{session.topic}</p>
                </div>
              </div>
            </div>
          )}

          {/* Notes if exists */}
          {session.notes && (
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <div className="flex items-start gap-2">
                <FileText className="w-4 h-4 text-slate-500 mt-0.5 shrink-0" />
                <div>
                  <p className="text-xs text-slate-500 font-medium mb-1">Ghi chú</p>
                  <p className="text-sm text-slate-700">{session.notes}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t shrink-0">
          <Button variant="outline" onClick={onClose} className="w-full">
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

export default SessionDetailModal;
