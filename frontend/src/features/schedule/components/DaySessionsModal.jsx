/**
 * DaySessionsModal - Modal hiển thị tất cả sessions của một ngày
 * Dùng cho Calendar View khi ngày có quá nhiều sessions (> 3)
 */

import { 
  X, 
  Clock, 
  User, 
  MapPin,
  CheckCircle,
  XCircle,
  PlayCircle,
  AlertTriangle,
  Calendar as CalendarIcon
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SessionActionMenu } from './SessionActionMenu';

const STATUS_CONFIG = {
  scheduled: {
    label: 'Chưa học',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: CalendarIcon
  },
  in_progress: {
    label: 'Đang học',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: PlayCircle
  },
  overdue: {
    label: 'Quá hạn',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: AlertTriangle
  },
  completed: {
    label: 'Hoàn thành',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-slate-100 text-slate-500 border-slate-200',
    icon: XCircle
  }
};

const getDisplayStatus = (session) => {
  if (session.status === 'completed') return 'completed';
  if (session.status === 'cancelled') return 'cancelled';
  
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  
  if (now >= sessionStart && now <= sessionEnd) return 'in_progress';
  if (now > sessionEnd) return 'overdue';
  return 'scheduled';
};

const formatTime = (time) => time?.substring(0, 5) || '';

const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${date.getDate()}/${date.getMonth() + 1}/${date.getFullYear()}`;
};

export function DaySessionsModal({ 
  isOpen, 
  onClose, 
  date, 
  sessions = [],
  onAction
}) {
  if (!isOpen) return null;

  // Sort sessions by start time
  const sortedSessions = [...sessions].sort((a, b) => {
    return a.start_time.localeCompare(b.start_time);
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-slate-200">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              Lịch dạy - {formatDate(date)}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {sessions.length} buổi học trong ngày
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5 text-slate-500" />
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="space-y-3">
            {sortedSessions.map((session) => {
              const displayStatus = getDisplayStatus(session);
              const statusConfig = STATUS_CONFIG[displayStatus];
              const StatusIcon = statusConfig.icon;

              return (
                <div
                  key={session.id}
                  className={`
                    p-4 rounded-xl border-l-4 transition-all hover:shadow-md
                    ${displayStatus === 'overdue' ? 'bg-red-50/50 border-l-red-500' :
                      displayStatus === 'in_progress' ? 'bg-amber-50/50 border-l-amber-500' :
                      displayStatus === 'completed' ? 'bg-white border-l-green-500' :
                      displayStatus === 'cancelled' ? 'bg-slate-50 border-l-slate-300 opacity-60' :
                      'bg-white border-l-blue-500'
                    }
                  `}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0">
                      {/* Class & Session Number */}
                      <div className="flex items-center gap-3 mb-2">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0
                          ${displayStatus === 'overdue' ? 'bg-red-500' :
                            displayStatus === 'in_progress' ? 'bg-amber-500' :
                            displayStatus === 'completed' ? 'bg-green-500' :
                            displayStatus === 'cancelled' ? 'bg-slate-400' :
                            'bg-blue-500'
                          }
                        `}>
                          #{session.session_number}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className={`font-semibold text-slate-900 line-clamp-1 ${
                            displayStatus === 'cancelled' ? 'line-through' : ''
                          }`}>
                            {session.classes?.name}
                          </h3>
                          <p className="text-sm text-slate-500">
                            {session.classes?.code}
                          </p>
                        </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-3 gap-3 text-sm">
                        {/* Time */}
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-700">
                            {formatTime(session.start_time)} - {formatTime(session.end_time)}
                          </span>
                        </div>

                        {/* Teacher */}
                        <div className="flex items-center gap-2 min-w-0">
                          <User className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-700 truncate">
                            {session.users?.full_name || 'Chưa phân công'}
                          </span>
                        </div>

                        {/* Room */}
                        <div className="flex items-center gap-2 min-w-0">
                          <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                          <span className="text-slate-700 truncate">
                            {session.classes?.rooms?.name || 'Chưa xếp phòng'}
                          </span>
                        </div>
                      </div>

                      {/* Status Badge */}
                      <div className="mt-3">
                        <span className={`
                          inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                          ${statusConfig.color}
                        `}>
                          <StatusIcon className="w-3.5 h-3.5" />
                          {statusConfig.label}
                        </span>
                      </div>
                    </div>

                    {/* Action Menu */}
                    <div className="shrink-0">
                      <SessionActionMenu
                        session={{ ...session, displayStatus }}
                        onAction={onAction}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 p-6 border-t border-slate-200">
          <Button
            variant="outline"
            onClick={onClose}
          >
            Đóng
          </Button>
        </div>
      </div>
    </div>
  );
}

export default DaySessionsModal;
