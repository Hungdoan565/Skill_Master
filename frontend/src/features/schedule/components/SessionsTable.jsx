/**
 * SessionsTable Component - Bảng danh sách các buổi học
 * Với Dropdown Action Menu cho xử lý sự cố
 * Hỗ trợ bulk selection và bulk actions
 */

import { useState, useEffect, useMemo } from 'react';
import { 
  Clock, 
  MapPin, 
  User, 
  BookOpen,
  AlertTriangle,
  CheckCircle,
  XCircle,
  PlayCircle,
  Calendar,
  ChevronLeft,
  ChevronRight,
  CheckSquare,
  Square,
  Loader2
} from 'lucide-react';
import { SessionActionMenu } from './SessionActionMenu';

// Status badge config với icon và mô tả chi tiết
const STATUS_CONFIG = {
  scheduled: {
    label: 'Chưa học',
    description: 'Buổi học chưa đến giờ',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    badgeColor: 'bg-blue-500',
    icon: Calendar
  },
  in_progress: {
    label: 'Đang học',
    description: 'Buổi học đang diễn ra',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    badgeColor: 'bg-amber-500 animate-pulse',
    icon: PlayCircle
  },
  overdue: {
    label: 'Chưa điểm danh',
    description: 'Đã qua giờ, chưa điểm danh',
    color: 'bg-red-100 text-red-700 border-red-200',
    badgeColor: 'bg-red-500',
    icon: AlertTriangle
  },
  completed: {
    label: 'Hoàn thành',
    description: 'Đã điểm danh xong',
    color: 'bg-green-100 text-green-700 border-green-200',
    badgeColor: 'bg-green-500',
    icon: CheckCircle
  },
  cancelled: {
    label: 'Đã hủy',
    description: 'Buổi học bị hủy',
    color: 'bg-slate-100 text-slate-500 border-slate-200',
    badgeColor: 'bg-slate-400',
    icon: XCircle
  }
};

// Get actual status based on current time
const getDisplayStatus = (session) => {
  // If already completed or cancelled, use that
  if (session.status === 'completed') return 'completed';
  if (session.status === 'cancelled') return 'cancelled';
  
  // For scheduled sessions, check time
  const now = new Date();
  const sessionDate = session.session_date;
  
  const sessionStart = new Date(`${sessionDate}T${session.start_time}`);
  const sessionEnd = new Date(`${sessionDate}T${session.end_time}`);
  
  if (now >= sessionStart && now <= sessionEnd) {
    return 'in_progress'; // Đang trong giờ học
  }
  
  if (now > sessionEnd) {
    return 'overdue'; // Đã qua giờ nhưng chưa điểm danh
  }
  
  return 'scheduled'; // Chưa đến giờ
};

// Calculate time difference for display
const getTimeInfo = (session) => {
  const now = new Date();
  const sessionDate = session.session_date;
  const sessionStart = new Date(`${sessionDate}T${session.start_time}`);
  const sessionEnd = new Date(`${sessionDate}T${session.end_time}`);
  
  const diffMs = sessionStart - now;
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMins = Math.floor(diffMs / (1000 * 60));
  
  if (now >= sessionStart && now <= sessionEnd) {
    const remaining = Math.ceil((sessionEnd - now) / (1000 * 60));
    return { text: `Còn ${remaining} phút`, type: 'warning' };
  }
  
  if (now > sessionEnd) {
    const overdueMins = Math.floor((now - sessionEnd) / (1000 * 60));
    if (overdueMins < 60) return { text: `Chưa điểm danh`, type: 'danger' };
    const overdueHours = Math.floor(overdueMins / 60);
    if (overdueHours < 24) return { text: `Chưa điểm danh (${overdueHours}h)`, type: 'danger' };
    const overdueDays = Math.floor(overdueHours / 24);
    return { text: `Chưa điểm danh (${overdueDays}d)`, type: 'danger' };
  }
  
  // Future
  if (diffDays > 0) return { text: `Còn ${diffDays} ngày`, type: 'info' };
  if (diffHours > 0) return { text: `Còn ${diffHours}h`, type: 'info' };
  if (diffMins > 0) return { text: `Còn ${diffMins} phút`, type: 'success' };
  return { text: 'Sắp bắt đầu', type: 'success' };
};

// Format time
const formatTime = (time) => {
  if (!time) return '';
  return time.substring(0, 5); // HH:MM
};

// Format date with more detail
const formatDate = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  
  const days = ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
  const dayName = days[date.getDay()];
  
  const dateOnly = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  
  if (dateOnly(date) === dateOnly(today)) {
    return `📍 Hôm nay, ${date.getDate()}/${date.getMonth() + 1}`;
  }
  if (dateOnly(date) === dateOnly(tomorrow)) {
    return `⏰ Ngày mai, ${date.getDate()}/${date.getMonth() + 1}`;
  }
  if (dateOnly(date) === dateOnly(yesterday)) {
    return `⚠️ Hôm qua, ${date.getDate()}/${date.getMonth() + 1}`;
  }
  
  return `${dayName}, ${date.getDate()}/${date.getMonth() + 1}`;
};

export function SessionsTable({ 
  sessions, 
  loading,
  onAction, // Single handler for all actions
  onBulkAction // Handler for bulk actions: (action, sessionIds) => void
}) {
  const ITEMS_PER_PAGE = 20;
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);
  
  // Reset selections when sessions change
  useEffect(() => {
    setSelectedIds(new Set());
  }, [sessions]);
  
  // Reset to page 1 when sessions change and would be out of bounds
  useEffect(() => {
    const totalPages = Math.ceil(sessions.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages && totalPages > 0) {
      setCurrentPage(1);
    }
  }, [sessions.length, currentPage]);
  
  // Get selectable sessions (not locked, not completed/cancelled)
  const selectableSessions = useMemo(() => {
    return sessions.filter(s => !s.is_locked && s.status === 'scheduled');
  }, [sessions]);
  
  // Check if all selectable sessions on current page are selected
  const paginatedSessions = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return sessions.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [sessions, currentPage]);
  
  const selectableOnPage = useMemo(() => {
    return paginatedSessions.filter(s => !s.is_locked && s.status === 'scheduled');
  }, [paginatedSessions]);
  
  const allPageSelected = selectableOnPage.length > 0 && 
    selectableOnPage.every(s => selectedIds.has(s.id));
  
  const somePageSelected = selectableOnPage.some(s => selectedIds.has(s.id));
  
  // Toggle single selection
  const toggleSelect = (sessionId) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(sessionId)) {
        newSet.delete(sessionId);
      } else {
        newSet.add(sessionId);
      }
      return newSet;
    });
  };
  
  // Toggle all on current page
  const toggleSelectAll = () => {
    if (allPageSelected) {
      // Deselect all on page
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        selectableOnPage.forEach(s => newSet.delete(s.id));
        return newSet;
      });
    } else {
      // Select all on page
      setSelectedIds(prev => {
        const newSet = new Set(prev);
        selectableOnPage.forEach(s => newSet.add(s.id));
        return newSet;
      });
    }
  };
  
  // Handle bulk action
  const handleBulkAction = async (action) => {
    if (!onBulkAction || selectedIds.size === 0) return;
    
    setBulkLoading(true);
    try {
      await onBulkAction(action, Array.from(selectedIds));
      setSelectedIds(new Set()); // Clear selection after action
    } finally {
      setBulkLoading(false);
    }
  };
  
  if (loading) {
    return (
      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
        <div className="p-8 text-center">
          <div className="animate-spin w-8 h-8 border-4 border-orange-600 border-t-transparent rounded-full mx-auto mb-4" />
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

  // Pagination calculations
  const totalItems = sessions.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = Math.min(startIndex + ITEMS_PER_PAGE, totalItems);
  
  // Paginate sessions while preserving date grouping
  const paginatedGrouped = paginatedSessions.reduce((acc, session) => {
    const date = session.session_date;
    if (!acc[date]) acc[date] = [];
    acc[date].push(session);
    return acc;
  }, {});
  const paginatedDates = Object.keys(paginatedGrouped).sort();
  
  const goToPage = (page) => {
    const newPage = Math.max(1, Math.min(page, totalPages));
    setCurrentPage(newPage);
    // Smooth scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="relative">
      {/* Floating Bulk Action Bar */}
      {selectedIds.size > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4 duration-300">
          <div className="bg-slate-900 text-white px-6 py-3 rounded-2xl shadow-2xl flex items-center gap-4">
            <span className="text-sm font-medium">
              Đã chọn <span className="text-orange-400 font-bold">{selectedIds.size}</span> buổi học
            </span>
            <div className="h-6 w-px bg-slate-600" />
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleBulkAction('complete')}
                disabled={bulkLoading}
                className="px-4 py-1.5 bg-green-600 hover:bg-green-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle className="w-4 h-4" />
                )}
                Hoàn thành
              </button>
              <button
                onClick={() => handleBulkAction('cancel')}
                disabled={bulkLoading}
                className="px-4 py-1.5 bg-red-600 hover:bg-red-700 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {bulkLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                Hủy buổi
              </button>
            </div>
            <div className="h-6 w-px bg-slate-600" />
            <button
              onClick={() => setSelectedIds(new Set())}
              className="text-slate-400 hover:text-white text-sm transition-colors"
            >
              Bỏ chọn
            </button>
          </div>
        </div>
      )}
      
      <div className="bg-white rounded-xl border border-slate-200 overflow-visible">
        {/* Legend - Chú thích trạng thái */}
        <div className="bg-slate-50 border-b border-slate-200 px-4 py-2 rounded-t-xl">
          <div className="flex flex-wrap items-center gap-4 text-xs">
            <span className="font-medium text-slate-600">Chú thích:</span>
            {Object.entries(STATUS_CONFIG).map(([key, config]) => {
              const Icon = config.icon;
              return (
                <div key={key} className="flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${config.badgeColor}`}></span>
                  <Icon className="w-3 h-3 text-slate-500" />
                  <span className="text-slate-600">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Table Header - Make it sticky */}
        <div className="sticky top-0 z-10 bg-slate-50 border-b border-slate-200 px-4 py-3">
          <div className="grid grid-cols-12 gap-4 text-xs font-medium text-slate-500 uppercase tracking-wider">
            {/* Checkbox column */}
            <div className="col-span-1 flex items-center">
              <button
                onClick={toggleSelectAll}
                className="p-1 hover:bg-slate-200 rounded transition-colors"
                title={allPageSelected ? 'Bỏ chọn tất cả' : 'Chọn tất cả'}
              >
                {allPageSelected ? (
                  <CheckSquare className="w-5 h-5 text-orange-600" />
                ) : somePageSelected ? (
                  <div className="w-5 h-5 border-2 border-orange-600 rounded bg-orange-100 flex items-center justify-center">
                    <div className="w-2 h-0.5 bg-orange-600" />
                  </div>
                ) : (
                  <Square className="w-5 h-5 text-slate-400" />
                )}
              </button>
            </div>
            <div className="col-span-2">Lớp học</div>
            <div className="col-span-2">Thời gian</div>
            <div className="col-span-2">Giáo viên</div>
            <div className="col-span-2">Phòng học</div>
            <div className="col-span-2">Trạng thái</div>
            <div className="col-span-1 text-right">Thao tác</div>
          </div>
        </div>

        {/* Table Body - Grouped by Date */}
        <div className="divide-y divide-slate-100">
          {paginatedDates.map((date) => {
            const dateSessions = paginatedGrouped[date];
            const today = new Date().toISOString().split('T')[0];
            const isToday = date === today;
            const isPast = date < today;
            
            return (
              <div key={date}>
                {/* Date Header */}
                <div className={`px-4 py-2.5 border-b border-slate-100 ${
                  isToday ? 'bg-orange-50' : isPast ? 'bg-red-50/30' : 'bg-slate-50/50'
                }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-semibold ${
                      isToday ? 'text-orange-700' : isPast ? 'text-red-700' : 'text-slate-700'
                    }`}>
                      {formatDate(date)}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${
                      isToday ? 'bg-orange-100 text-orange-700' : 
                      isPast ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                    }`}>
                      {dateSessions.length} buổi
                    </span>
                  </div>
                </div>

                {/* Sessions for this date */}
                {dateSessions.map((session) => {
                  const displayStatus = getDisplayStatus(session);
                  const statusConfig = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.scheduled;
                  const timeInfo = getTimeInfo(session);
                  const StatusIcon = statusConfig.icon;
                  const isSelected = selectedIds.has(session.id);
                  const isSelectable = !session.is_locked && session.status === 'scheduled';
                  
                  return (
                    <div 
                      key={session.id}
                      className={`
                        px-4 py-3 hover:bg-slate-50 transition-colors border-l-4
                        ${isSelected ? 'bg-orange-50/50' : ''}
                        ${displayStatus === 'overdue' ? 'bg-red-50/30 border-l-red-500' : 
                          displayStatus === 'in_progress' ? 'bg-amber-50/30 border-l-amber-500' :
                          displayStatus === 'completed' ? 'border-l-green-500' :
                          displayStatus === 'cancelled' ? 'border-l-slate-300 opacity-60' : 'border-l-blue-500'}
                      `}
                    >
                      <div className="grid grid-cols-12 gap-4 items-center">
                        {/* Checkbox */}
                        <div className="col-span-1">
                          {isSelectable ? (
                            <button
                              onClick={() => toggleSelect(session.id)}
                              className="p-1 hover:bg-slate-200 rounded transition-colors"
                            >
                              {isSelected ? (
                                <CheckSquare className="w-5 h-5 text-orange-600" />
                              ) : (
                                <Square className="w-5 h-5 text-slate-400 hover:text-slate-600" />
                              )}
                            </button>
                          ) : (
                            <div className="w-7 h-7 flex items-center justify-center" title={session.is_locked ? 'Đã khóa sổ' : 'Không thể chọn'}>
                              <Square className="w-5 h-5 text-slate-200" />
                            </div>
                          )}
                        </div>
                        
                        {/* Class Info */}
                        <div className="col-span-2">
                          <div className="flex items-start gap-3">
                            <div className={`
                              w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm shrink-0
                              ${statusConfig.badgeColor}
                            `}>
                              #{session.session_number}
                            </div>
                            <div className="min-w-0">
                              <h4 className={`font-medium text-slate-900 line-clamp-1 ${
                                displayStatus === 'cancelled' ? 'line-through' : ''
                              }`}>
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
                            <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-slate-700">
                              {formatTime(session.start_time)} - {formatTime(session.end_time)}
                            </span>
                          </div>
                          {/* Time info badge */}
                          <div className={`mt-1 text-xs font-medium px-1.5 py-0.5 rounded inline-block ${
                            timeInfo.type === 'danger' ? 'bg-red-100 text-red-700' :
                            timeInfo.type === 'warning' ? 'bg-amber-100 text-amber-700' :
                            timeInfo.type === 'success' ? 'bg-green-100 text-green-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>
                            {timeInfo.text}
                          </div>
                        </div>

                        {/* Teacher */}
                        <div className="col-span-2">
                          <div className="flex items-center gap-2">
                            {session.users?.avatar_url ? (
                              <img 
                                src={session.users.avatar_url} 
                                alt="" 
                                className="w-7 h-7 rounded-full object-cover shrink-0"
                              />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center shrink-0">
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
                            <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="line-clamp-1">
                              {session.rooms?.name || session.classes?.rooms?.name || (
                                <span className="text-amber-600 bg-amber-50 px-1.5 py-0.5 rounded text-xs">Chưa xếp phòng</span>
                              )}
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
                          <div className="flex flex-col gap-1">
                            <span 
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border w-fit ${statusConfig.color}`}
                              title={statusConfig.description}
                            >
                              <StatusIcon className="w-3.5 h-3.5" />
                              {statusConfig.label}
                            </span>
                            {session.is_locked && (
                              <span className="text-xs text-slate-500 flex items-center gap-1" title="Không thể chỉnh sửa buổi học đã khóa sổ">
                                🔒 Đã khóa sổ
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Actions - Dropdown Menu */}
                        <div className="col-span-1 flex justify-end">
                          <SessionActionMenu 
                            session={{...session, displayStatus}}
                            onAction={onAction}
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            );
          })}
        </div>
        
        {/* Pagination Controls */}
        {totalPages > 1 && (
          <div className="bg-slate-50 border-t border-slate-200 px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Info */}
              <div className="text-sm text-slate-600">
                Hiển thị <span className="font-medium">{startIndex + 1}</span> - <span className="font-medium">{endIndex}</span> trong tổng số <span className="font-medium">{totalItems}</span> buổi học
              </div>
              
              {/* Pagination Buttons */}
              <div className="flex items-center gap-2">
                {/* Previous */}
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  <ChevronLeft className="w-4 h-4" />
                  Trước
                </button>
                
                {/* Page Numbers */}
                <div className="flex items-center gap-1">
                  {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                    let pageNum;
                    if (totalPages <= 5) {
                      pageNum = i + 1;
                    } else if (currentPage <= 3) {
                      pageNum = i + 1;
                    } else if (currentPage >= totalPages - 2) {
                      pageNum = totalPages - 4 + i;
                    } else {
                      pageNum = currentPage - 2 + i;
                    }
                    
                    return (
                      <button
                        key={pageNum}
                        onClick={() => goToPage(pageNum)}
                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-colors ${
                          currentPage === pageNum
                            ? 'bg-orange-600 text-white shadow-sm'
                            : 'text-slate-700 hover:bg-slate-100 border border-slate-200'
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                </div>
                
                {/* Next */}
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1.5 rounded-lg border border-slate-200 text-sm font-medium text-slate-700 hover:bg-slate-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1"
                >
                  Sau
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default SessionsTable;
