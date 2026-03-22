/**
 * SessionActionMenu - Dropdown menu các thao tác xử lý sự cố
 * Actions: Điểm danh, Đổi GV, Đổi phòng, Hủy buổi
 * Hiển thị rõ ràng action nào khả dụng và lý do tại sao bị vô hiệu hóa
 */

import { useState, useRef, useEffect } from 'react';
import { 
  MoreVertical,
  ClipboardCheck,
  UserCog,
  DoorOpen,
  XCircle,
  CheckCircle2,
  Eye,
  Lock,
  AlertCircle
} from 'lucide-react';

// Helper: Get display status
const getDisplayStatus = (session) => {
  if (session.displayStatus) return session.displayStatus;
  if (session.status === 'completed') return 'completed';
  if (session.status === 'cancelled') return 'cancelled';
  
  const now = new Date();
  const sessionStart = new Date(`${session.session_date}T${session.start_time}`);
  const sessionEnd = new Date(`${session.session_date}T${session.end_time}`);
  
  if (now >= sessionStart && now <= sessionEnd) return 'in_progress';
  if (now > sessionEnd) return 'overdue';
  return 'scheduled';
};

const MENU_ITEMS = [
  { 
    id: 'view', 
    label: 'Xem chi tiết', 
    icon: Eye, 
    color: 'text-slate-600 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700',
    enabled: () => true,
    disabledReason: () => ''
  },
  { 
    id: 'attendance', 
    label: 'Điểm danh', 
    icon: ClipboardCheck, 
    color: 'text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/30',
    enabled: (session) => {
      if (session.is_locked) return false;
      const status = getDisplayStatus(session);
      return status === 'overdue' || status === 'in_progress';
    },
    disabledReason: (session) => {
      if (session.is_locked) return 'Đã khóa sổ';
      const status = getDisplayStatus(session);
      if (status === 'completed') return 'Đã hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'scheduled') return 'Chưa đến giờ học';
      return '';
    }
  },
  { 
    id: 'complete', 
    label: 'Đánh dấu hoàn thành', 
    icon: CheckCircle2, 
    color: 'text-green-600 hover:bg-green-50 dark:text-green-400 dark:hover:bg-green-900/30',
    enabled: (session) => {
      if (session.is_locked) return false;
      const status = getDisplayStatus(session);
      return status === 'overdue' || status === 'in_progress';
    },
    disabledReason: (session) => {
      if (session.is_locked) return 'Đã khóa sổ';
      const status = getDisplayStatus(session);
      if (status === 'completed') return 'Đã hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'scheduled') return 'Chưa đến giờ học';
      return '';
    }
  },
  { 
    id: 'changeTeacher', 
    label: 'Đổi giáo viên', 
    icon: UserCog, 
    color: 'text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30',
    enabled: (session) => {
      if (session.is_locked) return false;
      return getDisplayStatus(session) === 'scheduled';
    },
    disabledReason: (session) => {
      if (session.is_locked) return 'Đã khóa sổ';
      const status = getDisplayStatus(session);
      if (status === 'completed') return 'Đã hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'in_progress') return 'Đang diễn ra';
      if (status === 'overdue') return 'Đã qua giờ';
      return '';
    },
    dividerBefore: true
  },
  { 
    id: 'changeRoom', 
    label: 'Đổi phòng học', 
    icon: DoorOpen, 
    color: 'text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/30',
    enabled: (session) => {
      if (session.is_locked) return false;
      return getDisplayStatus(session) === 'scheduled';
    },
    disabledReason: (session) => {
      if (session.is_locked) return 'Đã khóa sổ';
      const status = getDisplayStatus(session);
      if (status === 'completed') return 'Đã hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'in_progress') return 'Đang diễn ra';
      if (status === 'overdue') return 'Đã qua giờ';
      return '';
    }
  },
  { 
    id: 'cancel', 
    label: 'Hủy buổi học', 
    icon: XCircle, 
    color: 'text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30',
    enabled: (session) => {
      if (session.is_locked) return false;
      const status = getDisplayStatus(session);
      return status === 'scheduled' || status === 'in_progress';
    },
    disabledReason: (session) => {
      if (session.is_locked) return 'Đã khóa sổ';
      const status = getDisplayStatus(session);
      if (status === 'completed') return 'Đã hoàn thành';
      if (status === 'cancelled') return 'Đã hủy';
      if (status === 'overdue') return 'Đã qua giờ';
      return '';
    },
    dividerBefore: true
  }
];

export function SessionActionMenu({ 
  session, 
  onAction 
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState('bottom'); // 'top' | 'bottom'
  const menuRef = useRef(null);
  const buttonRef = useRef(null);

  // Calculate menu position when opening
  useEffect(() => {
    if (isOpen && buttonRef.current) {
      const buttonRect = buttonRef.current.getBoundingClientRect();
      const windowHeight = window.innerHeight;
      const menuHeight = 320; // approximate menu height
      
      // If menu would overflow bottom, show on top
      if (buttonRect.bottom + menuHeight > windowHeight - 20) {
        setMenuPosition('top');
      } else {
        setMenuPosition('bottom');
      }
    }
  }, [isOpen]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Close on escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const handleAction = (item) => {
    if (!item.enabled(session)) return;
    setIsOpen(false);
    onAction?.(item.id, session);
  };

  const displayStatus = getDisplayStatus(session);

  return (
    <div className="relative" ref={menuRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          p-2 rounded-lg transition-all
          ${isOpen 
            ? 'bg-slate-200 dark:bg-gray-600 text-slate-700 dark:text-gray-200' 
            : 'text-slate-400 dark:text-gray-500 hover:text-slate-600 dark:hover:text-gray-300 hover:bg-slate-100 dark:hover:bg-gray-700'
          }
        `}
        title="Thao tác"
      >
        <MoreVertical className="w-4 h-4" />
      </button>

      {/* Dropdown Menu - Using Portal-like fixed positioning */}
      {isOpen && (
        <div 
          className={`
            absolute right-0 z-[100]
            w-56 bg-white dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 shadow-xl shadow-slate-200/50 dark:shadow-black/30
            py-1 overflow-hidden
            ${menuPosition === 'top' 
              ? 'bottom-full mb-1' 
              : 'top-full mt-1'
            }
          `}
          style={{ 
            // Ensure menu doesn't get cut off by ensuring it's above other elements
            filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.15))'
          }}
        >
          {/* Status indicator */}
          <div className="px-3 py-2 bg-slate-50 dark:bg-gray-700/50 border-b border-slate-100 dark:border-gray-700 mb-1">
            <span className="text-xs text-slate-500 dark:text-gray-400">Trạng thái: </span>
            <span className={`text-xs font-medium ${
              displayStatus === 'overdue' ? 'text-red-600 dark:text-red-400' :
              displayStatus === 'in_progress' ? 'text-amber-600 dark:text-amber-400' :
              displayStatus === 'completed' ? 'text-green-600 dark:text-green-400' :
              displayStatus === 'cancelled' ? 'text-slate-500 dark:text-gray-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {displayStatus === 'scheduled' && 'Chưa học'}
              {displayStatus === 'in_progress' && 'Đang diễn ra'}
              {displayStatus === 'overdue' && 'Quá hạn'}
              {displayStatus === 'completed' && 'Hoàn thành'}
              {displayStatus === 'cancelled' && 'Đã hủy'}
            </span>
          </div>

          {MENU_ITEMS.map((item, idx) => {
            const Icon = item.icon;
            const isEnabled = item.enabled(session);
            const disabledReason = item.disabledReason(session);
            
            return (
              <div key={item.id}>
                {item.dividerBefore && idx > 0 && (
                  <div className="my-1 border-t border-slate-100 dark:border-gray-700" />
                )}
                <button
                  onClick={() => handleAction(item)}
                  disabled={!isEnabled}
                  className={`
                    w-full flex items-center justify-between px-3 py-2 text-sm
                    transition-colors group
                    ${isEnabled 
                      ? `font-medium ${item.color}` 
                      : 'text-slate-400 dark:text-gray-500 cursor-not-allowed'
                    }
                  `}
                  title={disabledReason || item.label}
                >
                  <div className="flex items-center gap-2">
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </div>
                  {!isEnabled && disabledReason && (
                    <span className="text-xs text-slate-400 dark:text-gray-500 flex items-center gap-1">
                      <Lock className="w-3 h-3" />
                    </span>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default SessionActionMenu;
