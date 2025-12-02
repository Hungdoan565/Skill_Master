/**
 * SessionsTable Component - Bảng danh sách các buổi học
 * Với Dropdown Action Menu cho xử lý sự cố
 */

import { 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  AlertTriangle
} from 'lucide-react';
import { SessionActionMenu } from './SessionActionMenu';

// Status badge config
const STATUS_CONFIG = {
  scheduled: {
    label: 'Sắp diễn ra',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Clock
  },
  completed: {
    label: 'Đã hoàn thành',
    color: 'bg-green-100 text-green-700 border-green-200'
  },
  cancelled: {
    label: 'Đã hủy',
    color: 'bg-slate-100 text-slate-500 border-slate-200 line-through'
  }
};

// Check if session is overdue (quá giờ mà chưa điểm danh)
const isOverdue = (session) => {
  if (session.status !== 'scheduled') return false;
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  return sessionEnd < new Date();
};

// Format time
const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM
};

// Format date
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
  const dayName = days[date.getDay()];
  return `${dayName}, ${date.getDate()}/${date.getMonth() + 1}`;
};

export function SessionsTable({ 
  sessions, 
  loading,
  onAction // Single handler for all actions
}) {
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-slate-500">Đang tải lịch dạy...</p>
        </div>
      </div>
    );
  }

  if (!sessions || sessions.length === 0) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 p-12 text-center">
        <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <BookOpen className="w-8 h-8 text-slate-400" />
        </div>
        <h3 className="text-lg font-medium text-slate-700 mb-2">Không có buổi học nào</h3>
        <p className="text-slate-500">Thử thay đổi bộ lọc hoặc chọn khoảng thời gian khác</p>
      </div>
    );
  }

  // Group sessions by date
  const groupedSessions = sessions.reduce((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
      {/* Table Header */}
      <div className="bg-slate-50 border-b border-slate-200 px-4 py-3">
        <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
          <div className="col-span-3">Lớp học</div>
          <div className="col-span-2">Thời gian</div>
          <div className="col-span-2">Giáo viên</div>
          <div className="col-span-2">Phòng học</div>
          <div className="col-span-2">Trạng thái</div>
          <div className="col-span-1 text-right">Thao tác</div>
        </div>
      </div>

      {/* Table Body - Grouped by Date */}
      <div className="divide-y divide-slate-100">
        {Object.entries(groupedSessions).map(([date, dateSessions]) => (
          <div key={date}>
            {/* Date Header */}
            <div className="bg-slate-50/50 px-4 py-2 border-b border-slate-100">
              <span className="text-sm font-semibold text-slate-700">
                📅 {formatDate(date)}
              </span>
              <span className="text-xs text-slate-500 ml-2">
                ({dateSessions.length} buổi)
              </span>
            </div>

            {/* Sessions for this date */}
            {dateSessions.map((session) => {
              const overdue = isOverdue(session);
              const statusConfig = STATUS_CONFIG[session.status] || STATUS_CONFIG.scheduled;
              
              return (
                <div 
                  key={session.id}
                  className={`
                    px-4 py-3 hover:bg-slate-50 transition-colors
                    ${overdue ? 'bg-red-50/50' : ''}
                  `}
                >
                  <div className="grid grid-cols-12 gap-4 items-center">
                    {/* Class Info */}
                    <div className="col-span-3">
                      <div className="flex items-start gap-3">
                        <div className={`
                          w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm
                          ${overdue ? 'bg-red-500' : 'bg-indigo-500'}
                        `}>
                          #{session.session_number}
                        </div>
                        <div>
                          <h4 className="font-medium text-slate-900 line-clamp-1">
                            {session.classes?.name}
                          </h4>
                          <p className="text-xs text-slate-500">
                            {session.classes?.code}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Time */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 text-sm">
                        <Clock className="w-4 h-4 text-slate-400" />
                        <span className="text-slate-700">
                          {formatTime(session.start_time)} - {formatTime(session.end_time)}
                        </span>
                      </div>
                      {session.duration_hours && (
                        <p className="text-xs text-slate-500 ml-5.5">
                          ({session.duration_hours}h)
                        </p>
                      )}
                    </div>

                    {/* Teacher */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {session.users?.avatar_url ? (
                          <img 
                            src={session.users.avatar_url} 
                            alt="" 
                            className="w-7 h-7 rounded-full object-cover"
                          />
                        ) : (
                          <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center">
                            <User className="w-4 h-4 text-slate-500" />
                          </div>
                        )}
                        <span className="text-sm text-slate-700 line-clamp-1">
                          {session.users?.full_name || 'Chưa phân công'}
                        </span>
                      </div>
                    </div>

                    {/* Room */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-1.5 text-sm text-slate-600">
                        <MapPin className="w-4 h-4 text-slate-400" />
                        <span className="line-clamp-1">
                          {session.classes?.rooms?.name || 'Chưa xếp phòng'}
                        </span>
                      </div>
                      {session.classes?.centers?.name && (
                        <p className="text-xs text-slate-500 ml-5.5 line-clamp-1">
                          {session.classes.centers.name}
                        </p>
                      )}
                    </div>

                    {/* Status */}
                    <div className="col-span-2">
                      <div className="flex items-center gap-2">
                        {overdue ? (
                          <span className="px-2.5 py-1 rounded-full text-xs font-bold border bg-red-600 text-white border-red-600 animate-pulse">
                            <AlertTriangle className="w-3 h-3 inline mr-1" />
                            QUÁ HẠN
                          </span>
                        ) : (
                          <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusConfig.color}`}>
                            {statusConfig.label}
                          </span>
                        )}
                        {session.is_locked && (
                          <span className="text-xs text-slate-400" title="Đã khóa sổ">
                            🔒
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions - Dropdown Menu */}
                    <div className="col-span-1 flex justify-end">
                      <SessionActionMenu 
                        session={session}
                        onAction={onAction}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default SessionsTable;
