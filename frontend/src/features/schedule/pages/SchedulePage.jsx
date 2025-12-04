/**
 * SchedulePage - Trang quản lý lịch học toàn hệ thống (Admin Macro-Management)
 * 
 * Tính năng:
 * - Xem lịch dạng Table / Calendar (Week/Month)
 * - Filter theo trạng thái, giáo viên, cơ sở
 * - Điểm danh nhanh từ danh sách
 * - Xử lý sự cố: Đổi GV, Đổi phòng, Hủy buổi
 * - Highlight các buổi chưa điểm danh (overdue)
 * - Export PDF/Excel
 * - Quản lý ngày lễ
 * - Tạo buổi học bù
 */

import { useState } from 'react';
import { 
  Calendar,
  RefreshCw,
  Download,
  CalendarOff,
  LayoutGrid,
  List,
  Settings2
} from 'lucide-react';
import { Button } from '@/components/ui/button';

// Feature imports
import { useGlobalSessions } from '../hooks';
import { 
  SessionStats, 
  SessionFilters, 
  SessionsTable,
  QuickAttendanceModal,
  ChangeTeacherModal,
  ChangeRoomModal,
  CancelSessionModal,
  SessionDetailModal,
  CalendarView,
  ExportScheduleModal,
  HolidayManagementModal,
  MakeupClassModal,
  TeacherAvailabilityModal,
  ScheduleExceptionModal,
  ConfirmModal
} from '../components';

export function SchedulePage() {
  // Hook for fetching sessions
  const {
    sessions,
    stats,
    loading,
    error,
    filters,
    updateFilters,
    applyPreset,
    filterOptions,
    fetchSessions,
    markSessionStatus
  } = useGlobalSessions();

  // View mode: 'table' | 'calendar'
  const [viewMode, setViewMode] = useState('table');

  // Modal states
  const [selectedSession, setSelectedSession] = useState(null);
  const [modals, setModals] = useState({
    attendance: false,
    changeTeacher: false,
    changeRoom: false,
    cancel: false,
    detail: false,
    export: false,
    holiday: false,
    makeup: false,
    teacherAvailability: false,
    scheduleException: false,
    confirmComplete: false
  });

  // Open a modal
  const openModal = (modalName, session) => {
    setSelectedSession(session);
    setModals(prev => ({ ...prev, [modalName]: true }));
  };

  // Close all modals
  const closeModal = (modalName) => {
    setModals(prev => ({ ...prev, [modalName]: false }));
  };

  // Handle action from dropdown menu
  const handleAction = async (actionId, session) => {
    switch (actionId) {
      case 'attendance':
        openModal('attendance', session);
        break;
      case 'complete':
        openModal('confirmComplete', session);
        break;
      case 'changeTeacher':
        openModal('changeTeacher', session);
        break;
      case 'changeRoom':
        openModal('changeRoom', session);
        break;
      case 'cancel':
        openModal('cancel', session);
        break;
      case 'view':
        openModal('detail', session);
        break;
      default:
        console.log('Unknown action:', actionId);
    }
  };

  // Handle success callback
  const handleSuccess = () => {
    fetchSessions(); // Refresh list
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="bg-white border-b sticky top-0 z-10">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-indigo-100 rounded-xl">
                <Calendar className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-slate-900">
                  Quản lý Lịch dạy
                </h1>
                <p className="text-sm text-slate-500">
                  Theo dõi, điểm danh và xử lý sự cố tất cả buổi học
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex items-center bg-slate-100 rounded-lg p-1">
                <Button
                  variant={viewMode === 'table' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('table')}
                  className="gap-1.5"
                >
                  <List className="w-4 h-4" />
                  Bảng
                </Button>
                <Button
                  variant={viewMode === 'calendar' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('calendar')}
                  className="gap-1.5"
                >
                  <LayoutGrid className="w-4 h-4" />
                  Lịch
                </Button>
              </div>

              {/* Action Buttons */}
              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('export', null)}
                className="gap-1.5"
              >
                <Download className="w-4 h-4" />
                Xuất
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('holiday', null)}
                className="gap-1.5"
              >
                <CalendarOff className="w-4 h-4" />
                Ngày lễ
              </Button>

              <Button
                variant="outline"
                size="sm"
                onClick={() => openModal('teacherAvailability', null)}
                className="gap-1.5"
              >
                <Settings2 className="w-4 h-4" />
                Lịch GV
              </Button>

              <Button
                variant="outline"
                onClick={fetchSessions}
                disabled={loading}
                className="gap-2"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Làm mới
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-6 space-y-6">
        {/* Stats Cards */}
        <SessionStats stats={stats} loading={loading} />

        {/* Filters */}
        <SessionFilters
          filters={filters}
          onFilterChange={updateFilters}
          onPresetClick={applyPreset}
          options={filterOptions}
        />

        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 text-red-600">
            <p className="font-medium">Có lỗi xảy ra</p>
            <p className="text-sm mt-1">{error}</p>
          </div>
        )}

        {/* Sessions View - Table or Calendar */}
        {viewMode === 'table' ? (
          <SessionsTable
            sessions={sessions}
            loading={loading}
            onAction={handleAction}
          />
        ) : (
          <CalendarView
            sessions={sessions}
            loading={loading}
            onSessionClick={(session) => openModal('detail', session)}
            onMakeupClick={() => openModal('makeup', null)}
          />
        )}
      </div>

      {/* Modals */}
      <QuickAttendanceModal
        isOpen={modals.attendance}
        onClose={() => closeModal('attendance')}
        session={selectedSession}
        onSuccess={handleSuccess}
      />

      <ChangeTeacherModal
        isOpen={modals.changeTeacher}
        onClose={() => closeModal('changeTeacher')}
        session={selectedSession}
        onSuccess={handleSuccess}
      />

      <ChangeRoomModal
        isOpen={modals.changeRoom}
        onClose={() => closeModal('changeRoom')}
        session={selectedSession}
        onSuccess={handleSuccess}
      />

      <CancelSessionModal
        isOpen={modals.cancel}
        onClose={() => closeModal('cancel')}
        session={selectedSession}
        onSuccess={handleSuccess}
      />

      <SessionDetailModal
        isOpen={modals.detail}
        onClose={() => closeModal('detail')}
        session={selectedSession}
      />

      {/* New Feature Modals */}
      <ExportScheduleModal
        isOpen={modals.export}
        onClose={() => closeModal('export')}
        filters={filters}
      />

      <HolidayManagementModal
        isOpen={modals.holiday}
        onClose={() => closeModal('holiday')}
        onSuccess={handleSuccess}
      />

      <MakeupClassModal
        isOpen={modals.makeup}
        onClose={() => closeModal('makeup')}
        onSuccess={handleSuccess}
      />

      <TeacherAvailabilityModal
        isOpen={modals.teacherAvailability}
        onClose={() => closeModal('teacherAvailability')}
      />

      <ScheduleExceptionModal
        isOpen={modals.scheduleException}
        onClose={() => closeModal('scheduleException')}
        session={selectedSession}
        onSuccess={handleSuccess}
      />

      {/* Confirm Complete Modal */}
      <ConfirmModal
        isOpen={modals.confirmComplete}
        onClose={() => closeModal('confirmComplete')}
        onConfirm={async () => {
          const success = await markSessionStatus(selectedSession?.id, 'completed');
          if (success) {
            handleSuccess();
            closeModal('confirmComplete');
          }
        }}
        type="success"
        title="Xác nhận hoàn thành"
        message={`Bạn muốn đánh dấu buổi học #${selectedSession?.session_number} là hoàn thành?`}
        confirmText="Xác nhận"
      />
    </div>
  );
}

export default SchedulePage;
