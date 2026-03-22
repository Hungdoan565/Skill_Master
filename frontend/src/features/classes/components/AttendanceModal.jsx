/**
 * AttendanceModal Component
 * Modal for marking student attendance
 */

import { 
  X, 
  Loader2, 
  Search, 
  Users,
  Check,
  Clock
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar } from './Avatar';

export function AttendanceModal({
  show,
  session,
  attendanceList,
  loading,
  saving,
  searchQuery,
  onSearchChange,
  onUpdateStatus,
  onUpdateNotes,
  onSave,
  onClose,
  summary
}) {
  if (!show || !session) return null;

  // Filter by search
  const filteredList = attendanceList.filter(s => 
    s.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    s.email?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50" 
        onClick={() => !saving && onClose()}
      />
      
      {/* Modal */}
      <div className="relative bg-white dark:bg-zinc-900 rounded-xl shadow-2xl border border-slate-200 dark:border-zinc-800 w-full max-w-xl max-h-[85vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-zinc-800">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
                Điểm danh buổi {session.session_number}
              </h3>
              <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
                {session.day_name}, {new Date(session.date).toLocaleDateString('vi-VN')} • {session.start_time} - {session.end_time}
              </p>
            </div>
            <button 
              onClick={onClose}
              disabled={saving}
              className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
            >
              <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
            </button>
          </div>
          
          {/* Quick Stats */}
          <div className="flex items-center gap-4 mt-3 text-sm">
            <StatItem color="emerald" label="Có mặt" count={summary.present} />
            <StatItem color="amber" label="Trễ" count={summary.late} />
            <StatItem color="red" label="Vắng" count={summary.absent} />
            <span className="ml-auto text-slate-400 dark:text-slate-500">
              {summary.total} học viên
            </span>
          </div>
        </div>

        {/* Search - Show if > 10 students */}
        {attendanceList.length > 10 && (
          <div className="px-5 py-2 border-b border-slate-100 dark:border-slate-700/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Tìm học viên..."
                className="w-full h-9 pl-9 pr-4 rounded-lg border border-slate-200 dark:border-slate-700 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-slate-50 dark:bg-slate-900/50 dark:text-slate-100"
              />
            </div>
          </div>
        )}

        {/* Attendance List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="text-center py-12">
              <Loader2 className="w-6 h-6 text-indigo-600 animate-spin mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Đang tải...</p>
            </div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-12">
              <Users className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
              <p className="text-sm text-slate-500 dark:text-slate-400">Không tìm thấy học viên</p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100 dark:divide-slate-700/50">
              {filteredList.map((student, index) => (
                <StudentRow
                  key={student.enrollment_id}
                  student={student}
                  index={index}
                  onUpdateStatus={onUpdateStatus}
                  onUpdateNotes={onUpdateNotes}
                />
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-slate-200 dark:border-zinc-800 bg-slate-50 dark:bg-zinc-800/50 flex items-center gap-3">
          <Button
            variant="outline"
            className="flex-1"
            onClick={onClose}
            disabled={saving}
          >
            Hủy
          </Button>
          <Button
            className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white"
            onClick={onSave}
            disabled={saving || attendanceList.length === 0}
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Đang lưu...
              </>
            ) : (
              'Lưu điểm danh'
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Sub-components
function StatItem({ color, label, count }) {
  const colorClasses = {
    emerald: 'bg-emerald-500',
    amber: 'bg-amber-500',
    red: 'bg-red-500'
  };
  
  const textClasses = {
    emerald: 'text-emerald-600',
    amber: 'text-amber-600',
    red: 'text-red-600'
  };

  return (
    <div className="flex items-center gap-1.5">
      <span className={`w-2 h-2 rounded-full ${colorClasses[color]}`} />
      <span className="text-slate-600 dark:text-slate-300">{label}:</span>
      <span className={`font-semibold ${textClasses[color]} dark:brightness-110`}>{count}</span>
    </div>
  );
}

function StudentRow({ student, index, onUpdateStatus, onUpdateNotes }) {
  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-slate-50 dark:hover:bg-slate-700/30 transition-colors">
      {/* Index */}
      <span className="w-5 text-center text-xs font-medium text-slate-400 dark:text-slate-500 flex-shrink-0">
        {index + 1}
      </span>

      {/* Avatar & Name */}
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <Avatar name={student.full_name} url={student.avatar_url} size="sm" />
        <span className="text-sm font-medium text-slate-900 dark:text-slate-100 truncate">
          {student.full_name}
        </span>
      </div>

      {/* Status Toggle Buttons */}
      <div className="flex items-center gap-1">
        <StatusButton
          active={student.status === 'present'}
          onClick={() => onUpdateStatus(student.enrollment_id, 'present')}
          color="emerald"
          icon={Check}
          title="Có mặt"
        />
        <StatusButton
          active={student.status === 'late'}
          onClick={() => onUpdateStatus(student.enrollment_id, 'late')}
          color="amber"
          icon={Clock}
          title="Đi trễ"
        />
        <StatusButton
          active={student.status === 'absent'}
          onClick={() => onUpdateStatus(student.enrollment_id, 'absent')}
          color="red"
          icon={X}
          title="Vắng mặt"
        />
      </div>

      {/* Notes input - Show when absent */}
      {student.status === 'absent' && (
        <input
          type="text"
          value={student.notes || ''}
          onChange={(e) => onUpdateNotes(student.enrollment_id, e.target.value)}
          placeholder="Lý do..."
          className="w-28 h-7 px-2 text-xs rounded border border-slate-200 dark:border-zinc-700 focus:outline-none focus:ring-1 focus:ring-red-400 focus:border-red-400 bg-white dark:bg-zinc-900 dark:text-slate-100"
        />
      )}
    </div>
  );
}

function StatusButton({ active, onClick, color, icon: Icon, title }) {
  const activeColors = {
    emerald: 'bg-emerald-500 text-white',
    amber: 'bg-amber-500 text-white',
    red: 'bg-red-500 text-white'
  };
  
  const hoverColors = {
    emerald: 'hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400',
    amber: 'hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/30 dark:hover:text-amber-400',
    red: 'hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/30 dark:hover:text-red-400'
  };

  return (
    <button
      onClick={onClick}
      className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
        active
          ? activeColors[color]
          : `bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500 ${hoverColors[color]}`
      }`}
      title={title}
    >
      <Icon className="w-4 h-4" />
    </button>
  );
}
