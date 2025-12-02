/**
 * SchedulePage - Trang quản lý lịch học toàn hệ thống (Admin Macro-Management)
 * 
 * Tính năng:
 * - Xem tất cả buổi học theo ngày/tuần/tháng
 * - Filter theo trạng thái, giáo viên, cơ sở
 * - Điểm danh nhanh từ danh sách
 * - Xử lý sự cố: Đổi GV, Đổi phòng, Hủy buổi
 * - Highlight các buổi chưa điểm danh (overdue)
 */

import { useState } from 'react';
import { 
  Calendar,
  RefreshCw
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
  SessionDetailModal
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

  // Modal states
  const [selectedSession, setSelectedSession] = useState(null);
  const [modals, setModals] = useState({
    attendance: false,
    changeTeacher: false,
    changeRoom: false,
    cancel: false,
    detail: false
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
        if (confirm(`Xác nhận hoàn thành buổi học #${session.session_number}?`)) {
          const success = await markSessionStatus(session.id, 'completed');
          if (!success) alert('Không thể cập nhật trạng thái');
        }
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

        {/* Sessions Table with Action Menu */}
        <SessionsTable
          sessions={sessions}
          loading={loading}
          onAction={handleAction}
        />
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
    </div>
  );
}

export default SchedulePage;
